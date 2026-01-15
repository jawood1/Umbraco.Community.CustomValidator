import type { ValidationResult } from './types.js';
import { UmbControllerBase } from '@umbraco-cms/backoffice/class-api';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import { UMB_AUTH_CONTEXT } from '@umbraco-cms/backoffice/auth';

export class ValidationApiService extends UmbControllerBase {
    constructor(host: UmbControllerHost) {
        super(host);
    }

    async validateDocument(id: string, culture?: string): Promise<ValidationResult> {
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
            throw new Error(`Validation request failed: ${response.statusText}`);
        }

        return await response.json();
    }
}
