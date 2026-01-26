import type { ValidationResult } from '../validation/types.js';
import { UmbControllerBase } from '@umbraco-cms/backoffice/class-api';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import { UMB_AUTH_CONTEXT } from '@umbraco-cms/backoffice/auth';
import { UMB_NOTIFICATION_CONTEXT } from '@umbraco-cms/backoffice/notification';

export class ValidationApiService extends UmbControllerBase {
    private readonly baseUrl: string;
    
    constructor(host: UmbControllerHost) {
        super(host);
        this.baseUrl = `${window.location.origin}/umbraco/management/api/v1/custom-validation`;
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
            
            if (culture) {
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
                await this.handleErrorResponse(response);
                
                // Return empty result on error so UI can continue
                return {
                    contentId: id,
                    hasValidator: false,
                    messages: []
                };
            }
            
            const result = await response.json();
            return result || {
                contentId: id,
                hasValidator: false,
                messages: []
            };
            
        } catch (error) {
            console.error('Validation API error:', error);
            
            // Show notification to user
            await this.showErrorNotification(error);
            
            // Return empty result so UI doesn't break
            return {
                contentId: id,
                hasValidator: false,
                messages: []
            };
        }
    }
    
    private async handleErrorResponse(response: Response): Promise<void> {
        const errorMessage = await this.extractErrorMessage(response);
        
        // Show user-friendly notification
        await this.showErrorNotification(new Error(errorMessage));
        
        console.error('Validation API error:', errorMessage);
    }
    
    private async extractErrorMessage(response: Response): Promise<string> {
        const defaultMessage = `Validation request failed: ${response.status} ${response.statusText}`;
        
        try {
            const errorData = await response.json();
            
            // Extract message from ProblemDetails format
            return errorData.detail || errorData.title || errorData.message || defaultMessage;
        } catch {
            return defaultMessage;
        }
    }
    
    private async showErrorNotification(error: Error | unknown): Promise<void> {
        try {
            const notificationContext = await this.getContext(UMB_NOTIFICATION_CONTEXT);
            
            if (notificationContext) {
                const message = error instanceof Error ? error.message : String(error);
                
                notificationContext.peek('danger', {
                    data: {
                        headline: 'Validation Error',
                        message: message
                    }
                });
            }
        } catch (notificationError) {
            console.error('Could not show notification:', notificationError);
        }
    }
}
