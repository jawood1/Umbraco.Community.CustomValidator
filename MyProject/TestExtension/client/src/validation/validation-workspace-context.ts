import { UmbControllerBase } from '@umbraco-cms/backoffice/class-api';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import { ValidationApiService } from './validation-api.service.js';
import type { ValidationResult } from './types.js';
import { UmbContextToken } from '@umbraco-cms/backoffice/context-api';
import { UmbObjectState } from '@umbraco-cms/backoffice/observable-api';

export const VALIDATION_WORKSPACE_CONTEXT = new UmbContextToken<ValidationWorkspaceContext>(
    'ValidationWorkspaceContext'
);

export class ValidationWorkspaceContext extends UmbControllerBase {
    #apiService = new ValidationApiService(this);
    #validationResults = new Map<string, ValidationResult>();
    #isValidating = new UmbObjectState<boolean>(false);

    public readonly isValidating = this.#isValidating.asObservable();

    constructor(host: UmbControllerHost) {
        super(host);

        this.provideContext(VALIDATION_WORKSPACE_CONTEXT, this);
    }

    async validateManually(documentId: string, culture?: string) {
        this.#isValidating.setValue(true);

        try {
            const result = await this.#apiService.validateDocument(documentId, culture);
            // Store result per culture
            const cultureKey = culture || 'default';
            this.#validationResults.set(cultureKey, result);
            return result;
        } catch (error) {
            console.error('Manual validation failed:', error);
            throw error;
        } finally {
            this.#isValidating.setValue(false);
        }
    }

    getValidationResult(culture?: string): ValidationResult | undefined {
        const cultureKey = culture || 'default';
        return this.#validationResults.get(cultureKey);
    }

    getLastValidationResult(): ValidationResult | undefined {
        // Return any available result
        return Array.from(this.#validationResults.values())[0];
    }

    hasBlockingErrors(culture?: string): boolean {
        const cultureKey = culture || 'default';
        const result = this.#validationResults.get(cultureKey);
        if (!result) return false;
        return result.messages.some(m => m.severity === 'Error');
    }

    clearValidation() {
        this.#validationResults.clear();
    }
}

export { ValidationWorkspaceContext as api };
