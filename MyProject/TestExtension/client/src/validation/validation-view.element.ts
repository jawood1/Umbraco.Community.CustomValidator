import { customElement, state, html, nothing, repeat } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { UmbTextStyles } from '@umbraco-cms/backoffice/style';
import { UMB_CONTENT_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/content';
import type { UmbWorkspaceViewElement } from '@umbraco-cms/backoffice/workspace';
import { VALIDATION_WORKSPACE_CONTEXT } from './validation-workspace-context.js';
import type { ValidationResult, ValidationMessage } from './types.js';

// Module-level map to track which documents have been validated
const validatedDocuments = new Map<string, boolean>();

@customElement('my-validation-workspace-view')
export class MyValidationWorkspaceView extends UmbLitElement implements UmbWorkspaceViewElement {
    @state()
    private _documentId?: string;

    @state()
    private _validationResult?: ValidationResult;

    @state()
    private _isValidating = false;

    @state()
    private _error?: string;

    #contentWorkspace?: typeof UMB_CONTENT_WORKSPACE_CONTEXT.TYPE;
    #currentDocumentId?: string;

    constructor() {
        super();

        this.consumeContext(UMB_CONTENT_WORKSPACE_CONTEXT, (workspace) => {
            if (!workspace) return;

            this.#contentWorkspace = workspace;

            this.observe(
                workspace.unique,
                async (unique) => {
                    const previousDocumentId = this.#currentDocumentId;
                    this._documentId = unique ?? undefined;
                    this.#currentDocumentId = unique ?? undefined;

                    // Clear validation results when switching documents
                    const validationContext = await this.getContext(VALIDATION_WORKSPACE_CONTEXT);
                    if (validationContext) {
                        validationContext.clearValidation();
                    }
                    
                    // Only reset validation flag when truly switching between different documents
                    if (previousDocumentId !== undefined && previousDocumentId !== unique) {
                        if (unique) {
                            validatedDocuments.delete(unique);
                        }
                    }
                }
            );
        });

        this.consumeContext(VALIDATION_WORKSPACE_CONTEXT, (validationContext) => {
            if (!validationContext) return;

            this.observe(
                validationContext.validationResult,
                (result) => {
                    this._validationResult = result;
                }
            );

            this.observe(
                validationContext.isValidating,
                (isValidating) => {
                    this._isValidating = isValidating;
                }
            );
        });
    }



    override connectedCallback() {
        super.connectedCallback();
        
        const hasValidatedOnce = this._documentId ? validatedDocuments.get(this._documentId) ?? false : false;
        
        // Validate when tab becomes visible
        if (this._documentId) {
            if (!hasValidatedOnce) {
                validatedDocuments.set(this._documentId, true);
                this.#validateWithoutSave();
            } else {
                this.#revalidateOnTabSwitch();
            }
        }
    }

    async #validateWithoutSave() {
        if (!this._documentId) return;

        const validationContext = await this.getContext(VALIDATION_WORKSPACE_CONTEXT);
        if (!validationContext) return;

        // Skip validation entirely if we already know there's no validator
        if (this._validationResult?.hasValidator === false) {
            return;
        }

        // Small delay to ensure workspace is fully loaded
        setTimeout(async () => {
            try {
                await validationContext.validateManually(this._documentId!);
            } catch (error) {
                console.debug('Validation skipped:', error);
            }
        }, 1000);
    }

    async #revalidateOnTabSwitch() {
        if (!this._documentId) return;

        const validationContext = await this.getContext(VALIDATION_WORKSPACE_CONTEXT);
        if (!validationContext) return;

        // Skip validation entirely if we already know there's no validator
        if (this._validationResult?.hasValidator === false) {
            return;
        }

        // Request save to ensure latest content, then validate
        try {
            if (this.#contentWorkspace?.requestSubmit) {
                await this.#contentWorkspace.requestSubmit();
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            await validationContext.validateManually(this._documentId);
        } catch (error) {
            console.debug('Auto-validation on tab switch skipped:', error);
        }
    }

    #handleValidateClick = async () => {
        if (!this._documentId) return;

        const validationContext = await this.getContext(VALIDATION_WORKSPACE_CONTEXT);
        if (!validationContext) return;

        this._error = undefined;

        // Skip validation entirely if we already know there's no validator
        if (this._validationResult?.hasValidator === false) {
            return;
        }

        try {
            // Request save to update preview content before validation
            if (this.#contentWorkspace?.requestSubmit) {
                await this.#contentWorkspace.requestSubmit();
                // Small delay to allow content cache to update
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            await validationContext.validateManually(this._documentId);
        } catch (error) {
            this._error = error instanceof Error ? error.message : 'Validation failed';
        }
    };

    #getSeverityColor(severity: string): string {
        switch (severity.toLowerCase()) {
            case 'error':
                return 'danger';
            case 'warning':
                return 'warning';
            case 'info':
                return 'positive';
            default:
                return 'default';
        }
    }

    #renderValidationResults() {
        // Loading state or no validation result yet
        if (this._isValidating || !this._validationResult) {
            return html`
                <uui-box headline="Status" headline-variant="h5">
                    <div style="display: flex; align-items: center; gap: var(--uui-size-space-3);">
                        <uui-loader></uui-loader>
                        <span>Validating...</span>
                    </div>
                </uui-box>
            `;
        }

        // Error state
        if (this._error) {
            return html`
                <uui-box headline="Status" headline-variant="h5">
                    <p><strong style="color: var(--uui-color-danger);">${this._error}</strong></p>
                </uui-box>
            `;
        }

        // No validator configured
        if (!this._validationResult.hasValidator) {
            return html`
                <uui-box headline="Status" headline-variant="h5">
                    <p>No validation configured for this content type (${this._validationResult.contentTypeAlias}).</p>
                </uui-box>
            `;
        }

        // Validation passed
        if (this._validationResult.messages.length === 0) {
            return html`
                <uui-box headline="Validation Results" headline-variant="h5">
                    <p style="color: var(--uui-color-positive);">
                        <uui-icon name="icon-check"></uui-icon>
                        All validations passed successfully.
                    </p>
                </uui-box>
            `;
        }

        // Validation messages
        return html`
            <uui-box headline="Validation Results" headline-variant="h5">
                <div>
                    ${repeat(
                        this._validationResult.messages,
                        (msg) => msg.message,
                        (msg) => this.#renderValidationMessage(msg)
                    )}
                </div>
            </uui-box>
        `;
    }

    #renderValidationMessage(msg: ValidationMessage) {
        const color = this.#getSeverityColor(msg.severity);

        return html`
            <p>
                <uui-tag color=${color} look="primary">
                    ${msg.severity}
                </uui-tag>
                ${msg.message}
                ${msg.propertyAlias ? html`
                    <span style="color: var(--uui-color-text-alt);">(${msg.propertyAlias})</span>
                ` : nothing}
            </p>
        `;
    }

    #getErrorCount(): number {
        if (!this._validationResult) return 0;
        return this._validationResult.messages.filter(m => m.severity === 'Error').length;
    }

    #getWarningCount(): number {
        if (!this._validationResult) return 0;
        return this._validationResult.messages.filter(m => m.severity === 'Warning').length;
    }

    #renderHeader() {
        const errorCount = this.#getErrorCount();
        const warningCount = this.#getWarningCount();

        return html`
            <div slot="headline">
                ${errorCount > 0 ? html`
                    <uui-icon name="icon-delete" style="color: var(--uui-color-danger);"></uui-icon>
                ` : html`
                    <uui-icon name="icon-check" style="color: var(--uui-color-positive);"></uui-icon>
                `}
                Document Validation
            </div>
            <div slot="header-actions">
                ${errorCount > 0 ? html`
                    <uui-tag color="danger" look="primary">${errorCount}</uui-tag>
                ` : nothing}
                ${warningCount > 0 ? html`
                    <uui-tag color="warning" look="primary">${warningCount}</uui-tag>
                ` : nothing}
            </div>
        `;
    }

    override render() {
        return html`
            <umb-body-layout header-transparent header-fit-height>
                <div style="display: flex; flex-direction: column; gap: var(--uui-size-layout-1);">
                    ${this._validationResult?.hasValidator !== false && this._validationResult !== undefined ? html`
                        <uui-box headline-variant="h4">
                            ${this.#renderHeader()}
                            <uui-button-group>
                                <uui-button
                                    look="primary"
                                    color="positive"
                                    label="Validate Document"
                                    @click=${this.#handleValidateClick}
                                    ?disabled=${!this._documentId || this._isValidating}>
                                    <uui-icon name="icon-check"></uui-icon>
                                    Validate Document
                                </uui-button>
                                ${this._isValidating ? html`<uui-loader></uui-loader>` : nothing}
                            </uui-button-group>
                        </uui-box>
                    ` : nothing}

                    ${this.#renderValidationResults()}
                </div>
            </umb-body-layout>
        `;
    }

    static override styles = [UmbTextStyles];
}

export { MyValidationWorkspaceView as element };

declare global {
    interface HTMLElementTagNameMap {
        'my-validation-workspace-view': MyValidationWorkspaceView;
    }
}
