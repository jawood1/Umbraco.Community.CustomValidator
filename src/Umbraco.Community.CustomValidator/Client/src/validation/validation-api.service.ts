import type { ValidationResult } from './types.js';
import { UmbControllerBase } from '@umbraco-cms/backoffice/class-api';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import { UMB_AUTH_CONTEXT } from '@umbraco-cms/backoffice/auth';

export class ValidationApiService extends UmbControllerBase {
    constructor(host: UmbControllerHost) {
        super(host);
    }

    async validateDocument(id: string, culture?: string): Promise<ValidationResult> {
        try {
            const authContext = await this.getContext(UMB_AUTH_CONTEXT);
            const token = await authContext?.getLatestToken();

            const url = new URL(`/umbraco/management/api/v1/validation/validate/${id}`, window.location.origin);
            if (culture) {
                url.searchParams.append('culture', culture);
            }

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                // Try to parse error message from response (supports both ProblemDetails and custom formats)
                let errorMessage = `Validation request failed: ${response.status} ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    // Check for ProblemDetails format (detail/title) or custom format (message)
                    if (errorData.detail) {
                        errorMessage = errorData.detail;
                    } else if (errorData.title) {
                        errorMessage = errorData.title;
                    } else if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch {
                    // If parsing fails, use default message
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            
            // Ensure we always return a valid ValidationResult
            return result || {
                contentId: id,
                contentTypeAlias: '',
                hasValidator: false,
                messages: []
            };
        } catch (error) {
            // Re-throw with more context
            if (error instanceof Error) {
                throw new Error(`Failed to validate document: ${error.message}`);
            }
            throw new Error('Failed to validate document: Unknown error');
        }
    }
}
