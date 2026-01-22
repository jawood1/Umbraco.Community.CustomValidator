import { UmbContextBase } from '@umbraco-cms/backoffice/class-api';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import { ValidationApiService } from '../apis/validation-api.service.js';
import type { ValidationResult } from '../validation/types.js';
import { UmbContextToken } from '@umbraco-cms/backoffice/context-api';
import { UmbObjectState, UmbNumberState } from '@umbraco-cms/backoffice/observable-api';

export class ValidationWorkspaceContext extends UmbContextBase {
    #apiService = new ValidationApiService(this);
    #isValidating = new UmbObjectState<boolean>(false);

    #istanceCounter = new UmbNumberState(0);
    readonly instanceCounter = this.#istanceCounter.asObservable();

    public readonly isValidating = this.#isValidating.asObservable();

    constructor(host: UmbControllerHost) {
        super(host, VALIDATION_WORKSPACE_CONTEXT);
    }

    incrementInstance() {
        this.#istanceCounter.setValue(this.#istanceCounter.value + 1);
    }

    resetInstanceCounter() {
        this.#istanceCounter.setValue(0);
    }

    async validateManually(documentId: string, culture?: string): Promise<ValidationResult> {
        this.#isValidating.setValue(true);
        try {
            return await this.#apiService.validateDocument(documentId, culture);
        } catch (error) {
            console.error('Manual validation failed:', error);
            throw error;
        } finally {
            this.#isValidating.setValue(false);
        }
    }
}

export { ValidationWorkspaceContext as api };

export const VALIDATION_WORKSPACE_CONTEXT = new UmbContextToken<ValidationWorkspaceContext>(
    'UmbWorkspaceContext',
    'ValidationWorkspaceContext'
);