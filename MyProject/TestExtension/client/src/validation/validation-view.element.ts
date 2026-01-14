import { customElement, state, html, nothing, repeat } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { UmbTextStyles } from '@umbraco-cms/backoffice/style';
import { UMB_CONTENT_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/content';
import { UMB_DOCUMENT_WORKSPACE_CONTEXT } from "@umbraco-cms/backoffice/document";
import type { UmbWorkspaceViewElement } from '@umbraco-cms/backoffice/workspace';
import { VALIDATION_WORKSPACE_CONTEXT } from './validation-workspace-context.js';
import type { ValidationResult, ValidationMessage } from './types.js';

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

    #documentWorkspace?: typeof UMB_DOCUMENT_WORKSPACE_CONTEXT.TYPE;

    constructor() {
        super();

        this.consumeContext(UMB_DOCUMENT_WORKSPACE_CONTEXT, (workspace) => {
            if (!workspace) return;

            this.#documentWorkspace = workspace;
        });

        this.consumeContext(UMB_CONTENT_WORKSPACE_CONTEXT, (workspace) => {
            if (!workspace) return;

            this.observe(
                workspace.unique,
                async (unique) => {
                    this._documentId = unique ?? undefined;

                    // Clear validation results when switching documents
                    const validationContext = await this.getContext(VALIDATION_WORKSPACE_CONTEXT);
                    if (validationContext) {
                        validationContext.clearValidation();
                    }
                    
                    // Auto-validate when document ID is available
                    if (unique) {
                        this.#autoValidateOnLoad(unique);
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

    async #autoValidateOnLoad(documentId: string) {
        // Auto-validate when component loads to show any blocking errors
        const validationContext = await this.getContext(VALIDATION_WORKSPACE_CONTEXT);
        if (!validationContext) return;

        // Small delay to ensure workspace is fully loaded
        setTimeout(async () => {
            try {
                await validationContext.validateManually(documentId);
            } catch (error) {
                // Silent fail on auto-validation
                console.debug('Auto-validation skipped:', error);
            }
        }, 1000);
    }

    override connectedCallback() {
        super.connectedCallback();
        
        // Re-validate when tab becomes visible
        if (this._documentId) {
            this.#revalidateOnTabSwitch();
        }
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
            if (this.#documentWorkspace?.requestSubmit) {
                await this.#documentWorkspace.requestSubmit();
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
            if (this.#documentWorkspace?.requestSubmit) {
                await this.#documentWorkspace.requestSubmit();
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
        // Loading state
        if (this._isValidating) {
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

        // No validation result yet
        if (!this._validationResult) {
            return html`
                <uui-box headline="Status" headline-variant="h5">
                    <p style="color: var(--uui-color-text-alt);">Ready to validate</p>
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
