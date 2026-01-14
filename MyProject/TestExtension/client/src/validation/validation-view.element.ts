import { customElement, state, html, nothing, repeat } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { UmbTextStyles } from '@umbraco-cms/backoffice/style';
import { UMB_CONTENT_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/content';
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

    constructor() {
        super();

        this.consumeContext(UMB_CONTENT_WORKSPACE_CONTEXT, (workspace) => {
            if (!workspace) return;
            
            this.observe(
                workspace.unique,
                (unique) => {
                    this._documentId = unique ?? undefined;
                    
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

    #handleValidateClick = async () => {
        if (!this._documentId) return;

        const validationContext = await this.getContext(VALIDATION_WORKSPACE_CONTEXT);
        if (!validationContext) return;

        this._error = undefined;

        try {
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

    #renderError() {
        if (!this._error) return nothing;

        return html`
            <uui-box headline="Error">
                <div style="color: var(--uui-color-danger);">
                    ${this._error}
                </div>
            </uui-box>
        `;
    }

    #renderEmptyState() {
        if (!this._validationResult) return nothing;

        if (!this._validationResult.hasValidator) {
            return html`
                <uui-box headline="No Validator Available">
                    <p>No validation configured for this content type (${this._validationResult.contentTypeAlias}).</p>
                </uui-box>
            `;
        }

        if (this._validationResult.messages.length === 0) {
            return html`
                <uui-box headline="Validation Complete">
                    <p>No validation messages.</p>
                </uui-box>
            `;
        }

        return nothing;
    }

    #renderValidationMessages() {
        if (!this._validationResult || this._validationResult.messages.length === 0) {
            return nothing;
        }

        return html`
            <uui-box headline="Validation Results">
                ${repeat(
                    this._validationResult.messages,
                    (msg) => msg.message,
                    (msg) => this.#renderValidationMessage(msg)
                )}
            </uui-box>
        `;
    }

    #renderValidationMessage(msg: ValidationMessage) {
        const color = this.#getSeverityColor(msg.severity);

        return html`
            <div class="validation-message">
                <uui-badge color=${color} look="primary">
                    ${msg.severity}
                </uui-badge>
                <span class="message-text">${msg.message}</span>
                ${msg.propertyAlias ? html`
                    <span class="property-alias">(${msg.propertyAlias})</span>
                ` : nothing}
            </div>
        `;
    }

    override render() {
        return html`
            <style>
                .container {
                    display: flex;
                    flex-direction: column;
                    gap: var(--uui-size-space-4);
                    padding: var(--uui-size-layout-1);
                }

                .actions {
                    display: flex;
                    align-items: center;
                    gap: var(--uui-size-space-3);
                }

                .validation-message {
                    display: flex;
                    align-items: center;
                    gap: var(--uui-size-space-3);
                    padding: var(--uui-size-space-3);
                    border-bottom: 1px solid var(--uui-color-border);
                }

                .validation-message:last-child {
                    border-bottom: none;
                }

                .message-text {
                    flex: 1;
                }

                .property-alias {
                    color: var(--uui-color-text-alt);
                    font-size: 0.9em;
                }
            </style>
            <div class="container">
                <uui-box>
                    <div slot="headline">Document Validation</div>
                    <div class="actions">
                        <uui-button
                            look="primary"
                            color="positive"
                            @click=${this.#handleValidateClick}
                            ?disabled=${!this._documentId || this._isValidating}>
                            <uui-icon name="icon-check"></uui-icon>
                            Validate Document
                        </uui-button>
                        ${this._isValidating ? html`<uui-loader></uui-loader>` : nothing}
                    </div>
                </uui-box>

                ${this.#renderError()}
                ${this.#renderEmptyState()}
                ${this.#renderValidationMessages()}
            </div>
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
