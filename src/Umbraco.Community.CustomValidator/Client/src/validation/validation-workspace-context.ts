import { UmbControllerBase } from '@umbraco-cms/backoffice/class-api';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import { ValidationApiService } from './validation-api.service.js';
import type { ValidationResult } from './types.js';
import { ValidationSeverity } from './types.js';
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

    /**
     * Always use the multi-culture POST endpoint. If allCultures is omitted, validates current (single) culture.
     * Results are stored per culture.
     */
    async validateManually(documentId: string, culture?: string, allCultures?: string[]): Promise<Record<string, ValidationResult>> {
        this.#isValidating.setValue(true);
        try {
            const cultures = allCultures && allCultures.length > 0 ? allCultures : [culture];
            const results = await this.#apiService.validateDocumentMultipleCultures(documentId, cultures);
            for (const [cultureKey, result] of Object.entries(results)) {
                this.#validationResults.set(cultureKey, result);
            }
            return results;
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

    hasBlockingErrors(culture?: string): boolean {
        const cultureKey = culture || 'default';
        const result = this.#validationResults.get(cultureKey);
        if (!result) return false;
        return result.messages.some(m => m.severity === ValidationSeverity.Error);
    }

    clearValidation() {
        this.#validationResults.clear();
    }
}

export { ValidationWorkspaceContext as api };
