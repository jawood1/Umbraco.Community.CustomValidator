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
    #validationResult = new UmbObjectState<ValidationResult | undefined>(undefined);
    #isValidating = new UmbObjectState<boolean>(false);

    public readonly validationResult = this.#validationResult.asObservable();
    public readonly isValidating = this.#isValidating.asObservable();

    constructor(host: UmbControllerHost) {
        super(host);

        this.provideContext(VALIDATION_WORKSPACE_CONTEXT, this);
    }

    async validateManually(documentId: string) {
        this.#isValidating.setValue(true);

        try {
            const result = await this.#apiService.validateDocument(documentId);
            this.#validationResult.setValue(result);
            return result;
        } catch (error) {
            console.error('Manual validation failed:', error);
            throw error;
        } finally {
            this.#isValidating.setValue(false);
        }
    }

    getLastValidationResult(): ValidationResult | undefined {
        return this.#validationResult.getValue();
    }

    hasBlockingErrors(): boolean {
        const result = this.#validationResult.getValue();
        if (!result) return false;
        return result.messages.some(m => m.severity === 'Error');
    }

    clearValidation() {
        this.#validationResult.setValue(undefined);
    }
}

export { ValidationWorkspaceContext as api };
