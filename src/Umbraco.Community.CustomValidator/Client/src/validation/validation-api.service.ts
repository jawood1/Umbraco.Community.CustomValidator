import type { ValidationResult } from './types.js';
import { ValidationSeverity } from './types.js';
import { UmbControllerBase } from '@umbraco-cms/backoffice/class-api';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import { UMB_AUTH_CONTEXT } from '@umbraco-cms/backoffice/auth';

export class ValidationApiService extends UmbControllerBase {
    constructor(host: UmbControllerHost) {
        super(host);
    }
    
    async validateDocumentMultipleCultures(id: string, cultures: (string | undefined)[]): Promise<Record<string, ValidationResult>> {
        try {
            const authContext = await this.getContext(UMB_AUTH_CONTEXT);
            const token = await authContext?.getLatestToken();

            const url = new URL(`/umbraco/management/api/v1/validation/validate/${id}`, window.location.origin);
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cultures }),
            });

            if (!response.ok) {
                let errorMessage = `Validation request failed: ${response.status} ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    if (errorData.detail) {
                        errorMessage = errorData.detail;
                    } else if (errorData.title) {
                        errorMessage = errorData.title;
                    } else if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch {}
                throw new Error(errorMessage);
            }

            const result = await response.json();
            return result || {};
        } catch (error) {
            // Return a fallback error result for all requested cultures
            const fallback: Record<string, ValidationResult> = {};
            for (const culture of cultures) {
                fallback[culture || 'default'] = {
                    contentId: id,
                    contentTypeAlias: '',
                    hasValidator: false,
                    messages: [{ message: `Validation failed: ${(error as Error).message}`, severity: ValidationSeverity.Error }]
                };
            }
            return fallback;
        }
    }

    async validateDocument(id: string, culture?: string): Promise<ValidationResult> {
        const results = await this.validateDocumentMultipleCultures(id, [culture]);
        return results[culture || 'default'];
    }
}
