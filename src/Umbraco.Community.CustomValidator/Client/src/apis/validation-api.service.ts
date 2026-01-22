import type { ValidationResult } from '../validation/types.js';
import { UmbControllerBase } from '@umbraco-cms/backoffice/class-api';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import { UMB_AUTH_CONTEXT } from '@umbraco-cms/backoffice/auth';

export class ValidationApiService extends UmbControllerBase {
    private readonly baseUrl: string;
    
    constructor(host: UmbControllerHost) {
        super(host);
        this.baseUrl = `${window.location.origin}/umbraco/management/api/v1/validation`;
    }
    
    async validateDocument(
        id: string, 
        culture?: string,
    ): Promise<ValidationResult> {
        try {
            const authContext = await this.getContext(UMB_AUTH_CONTEXT);
            const token = await authContext?.getLatestToken();
            
            if (!token) {
                throw new Error('Authentication token not available');
            }
            
            const url = new URL(`${this.baseUrl}/validate/${encodeURIComponent(id)}`);
            
            if(culture) {
                url.searchParams.append('culture', culture);
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                const errorMessage = await this.extractErrorMessage(response);
                throw new Error(errorMessage);
            }
            
            const result = await response.json();
            return result || {};
            
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : String(error));
        }
    }
    
    private async extractErrorMessage(response: Response): Promise<string> {
        const defaultMessage = `Validation request failed: ${response.status} ${response.statusText}`;
        
        try {
            const errorData = await response.json();
            return errorData.detail || errorData.title || errorData.message || defaultMessage;
        } catch {
            return defaultMessage;
        }
    }
}
