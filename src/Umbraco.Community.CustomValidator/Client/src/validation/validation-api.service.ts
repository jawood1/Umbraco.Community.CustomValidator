import type { ValidationResult } from './types.js';
import { ValidationSeverity } from './types.js';
import { UmbControllerBase } from '@umbraco-cms/backoffice/class-api';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import { UMB_AUTH_CONTEXT } from '@umbraco-cms/backoffice/auth';

export class ValidationApiService extends UmbControllerBase {
    private readonly baseUrl: string;
    
    constructor(host: UmbControllerHost) {
        super(host);
        this.baseUrl = `${window.location.origin}/umbraco/management/api/v1/validation`;
    }
    
    /**
     * Validates a document across multiple cultures
     * @param id - Document identifier
     * @param cultures - Array of culture codes to validate (undefined for invariant culture)
     * @returns Validation results keyed by culture code
     */
    async validateDocumentMultipleCultures(
        id: string, 
        cultures: (string | undefined)[]
    ): Promise<Record<string, ValidationResult>> {
        try {
            const authContext = await this.getContext(UMB_AUTH_CONTEXT);
            const token = await authContext?.getLatestToken();
            
            if (!token) {
                throw new Error('Authentication token not available');
            }
            
            const url = `${this.baseUrl}/validate/${encodeURIComponent(id)}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cultures }),
            });
            
            if (!response.ok) {
                const errorMessage = await this.extractErrorMessage(response);
                throw new Error(errorMessage);
            }
            
            const result = await response.json();
            return result || {};
            
        } catch (error) {
            return this.createFallbackResults(id, cultures, error);
        }
    }
    
    /**
     * Validates a document for a single culture
     * @param id - Document identifier
     * @param culture - Culture code (undefined for invariant culture)
     * @returns Validation result for the specified culture
     */
    async validateDocument(id: string, culture?: string): Promise<ValidationResult> {
        const results = await this.validateDocumentMultipleCultures(id, [culture]);
        return results[culture || 'default'];
    }
    
    /**
     * Extracts error message from failed response
     */
    private async extractErrorMessage(response: Response): Promise<string> {
        const defaultMessage = `Validation request failed: ${response.status} ${response.statusText}`;
        
        try {
            const errorData = await response.json();
            return errorData.detail || errorData.title || errorData.message || defaultMessage;
        } catch {
            return defaultMessage;
        }
    }
    
    /**
     * Creates fallback validation results when validation fails
     */
    private createFallbackResults(
        id: string, 
        cultures: (string | undefined)[], 
        error: unknown
    ): Record<string, ValidationResult> {
        const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
        const fallback: Record<string, ValidationResult> = {};
        
        for (const culture of cultures) {
            const cultureKey = culture || 'default';
            fallback[cultureKey] = {
                contentId: id,
                hasValidator: false,
                messages: [{
                    message: `Validation failed: ${errorMessage}`,
                    severity: ValidationSeverity.Error
                }]
            };
        }
        
        return fallback;
    }
}
