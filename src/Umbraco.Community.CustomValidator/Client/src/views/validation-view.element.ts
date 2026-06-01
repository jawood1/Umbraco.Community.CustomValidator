import { customElement, state, html, nothing, repeat, LitElement } from '@umbraco-cms/backoffice/external/lit';
import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api';
import { UmbTextStyles } from '@umbraco-cms/backoffice/style';
import { UMB_CONTENT_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/content';
import { VALIDATION_WORKSPACE_CONTEXT } from '../contexts/validation-workspace-context.js';
import type { ValidationResult, NotificationColor, ValidationMessage } from '../validation/types.js';
import { ValidationSeverity } from '../validation/types.js';

const SEVERITY_ORDER: Record<ValidationSeverity, number> = {
    [ValidationSeverity.Error]: 0,
    [ValidationSeverity.Warning]: 1,
    [ValidationSeverity.Info]: 2
} as const;

const SEVERITY_COLOR_MAP: Record<ValidationSeverity, NotificationColor> = {
    [ValidationSeverity.Error]: 'danger',
    [ValidationSeverity.Warning]: 'warning',
    [ValidationSeverity.Info]: 'default'
} as const;

@customElement('custom-validator-workspace-view')
export class CustomValidatorWorkspaceView extends UmbElementMixin(LitElement) {
    #countContext?: typeof VALIDATION_WORKSPACE_CONTEXT.TYPE;
    #instanceIndexAssigned = false;

    @state()
    private instanceCount = 0;

    @state()
    private _validationResult?: ValidationResult;

    @state()
    private _isValidating = false;

    @state()
    private _currentCulture?: string;

    constructor() {
        super();

        this.consumeContext(VALIDATION_WORKSPACE_CONTEXT, (instance) => {
            if (!instance) return;
            this.#countContext = instance;

            this.observe(instance.instanceCounter, (count) => {
                if (!this.#instanceIndexAssigned) {
                    this.#instanceIndexAssigned = true;
                    this.instanceCount = count;
                    instance.incrementInstance();
                    this.#setupCultureObserver();
                }
            });

            this.observe(instance.isValidating, (v) => { this._isValidating = v; });
            this.observe(instance.validationResult, (r) => { this._validationResult = r; });
        });
    }

    #setupCultureObserver() {
        this.consumeContext(UMB_CONTENT_WORKSPACE_CONTEXT, (workspace) => {
            if (!workspace) return;
            this.observe(
                workspace.splitView.activeVariantByIndex(this.instanceCount),
                (variant) => { this._currentCulture = (variant as { culture?: string } | undefined)?.culture ?? undefined; }
            );
        });
    }

    override disconnectedCallback() {
        super.disconnectedCallback();
        if (this.#countContext) {
            this.#countContext.resetInstanceCounter();
        }
    }

    #handleValidateClick = async () => {
        await this.#countContext?.triggerManualValidation({
            culture: this._currentCulture,
            withSave: true,
        });
    };

    #getMessageCounts(): { errors: number; warnings: number } {
        if (!this._validationResult) {
            return { errors: 0, warnings: 0 };
        }
        return {
            errors: this._validationResult.messages.filter(m => m.severity === ValidationSeverity.Error).length,
            warnings: this._validationResult.messages.filter(m => m.severity === ValidationSeverity.Warning).length
        };
    }

    #getSeverityColor(severity: ValidationSeverity): NotificationColor {
        return SEVERITY_COLOR_MAP[severity];
    }

    #renderValidationResults() {
        if (this._isValidating || !this._validationResult) {
            return this.#renderLoadingState();
        }

        if (!this._validationResult.hasValidator) {
            return html`
                <uui-box headline="Status" headline-variant="h5">
                    <p>No custom validation configured for this document.</p>
                </uui-box>`;
        }

        const hasErrorsOrWarnings = this._validationResult.messages.some(
            m => m.severity === ValidationSeverity.Error || m.severity === ValidationSeverity.Warning);

        return html`
            <uui-box headline="Validation Results" headline-variant="h5">
                ${!hasErrorsOrWarnings ? this.#renderSuccessMessage() : nothing}
                ${this._validationResult.messages.length > 0 ? this.#renderMessagesTable(this._validationResult.messages) : nothing}
            </uui-box>
        `;
    }

    #renderMessagesTable(messages: ValidationMessage[]): unknown {
        const sortedMessages = [...messages].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

        return html`
            <uui-table aria-label="Validation Messages">
                <uui-table-head>
                    <uui-table-head-cell style="width: 120px;">Severity</uui-table-head-cell>
                    <uui-table-head-cell>Message</uui-table-head-cell>
                </uui-table-head>
                ${repeat(
                    sortedMessages,
                    (msg) => msg.message,
                    (msg) => html`
                        <uui-table-row>
                            <uui-table-cell>
                                <uui-tag color=${this.#getSeverityColor(msg.severity)} look="primary">
                                    ${msg.severity}
                                </uui-tag>
                            </uui-table-cell>
                            <uui-table-cell>${msg.message}</uui-table-cell>
                        </uui-table-row>
                    `
                )}
            </uui-table>`;
    }

    #renderLoadingState() {
        return html`
            <uui-box headline="Status" headline-variant="h5">
                <div style="display: flex; align-items: center; gap: var(--uui-size-space-3);">
                    <uui-loader></uui-loader>
                    <span>Validating...</span>
                </div>
            </uui-box>
        `;
    }

    #renderSuccessMessage() {
        return html`
            <p style="color: var(--uui-color-positive);">
                <uui-icon name="icon-check"></uui-icon>
                All validations passed successfully.
            </p>
        `;
    }

    #renderHeader() {
        const { errors, warnings } = this.#getMessageCounts();

        return html`
            <div slot="headline">
                ${errors > 0
                    ? html`<uui-icon name="icon-delete" style="color: var(--uui-color-danger);"></uui-icon>`
                    : html`<uui-icon name="icon-check" style="color: var(--uui-color-positive);"></uui-icon>`}
                Document Validation
            </div>
            <div slot="header-actions">
                ${errors > 0 ? html`<uui-tag color="danger" look="primary">${errors}</uui-tag>` : nothing}
                ${warnings > 0 ? html`<uui-tag color="warning" look="primary">${warnings}</uui-tag>` : nothing}
            </div>
        `;
    }

    #renderControls() {
        return html`
            <uui-button-group>
                <uui-button
                    look="primary"
                    color="default"
                    label="Save & Validate"
                    @click=${this.#handleValidateClick}
                    ?disabled=${this._isValidating}>
                    Save & Validate
                </uui-button>
                ${this._isValidating ? html`<uui-loader></uui-loader>` : nothing}
            </uui-button-group>
        `;
    }

    override render() {
        const shouldShowControls = this._validationResult?.hasValidator !== false && this._validationResult !== undefined;

        return html`
            <umb-body-layout header-transparent header-fit-height>
                <div style="display: flex; flex-direction: column; gap: var(--uui-size-layout-1);">
                    ${shouldShowControls ? html`
                        <uui-box headline-variant="h4">
                            ${this.#renderHeader()}
                            ${this.#renderControls()}
                        </uui-box>
                    ` : nothing}
                    ${this.#renderValidationResults()}
                </div>
            </umb-body-layout>
        `;
    }

    static override styles = [UmbTextStyles];
}

export { CustomValidatorWorkspaceView as element };

declare global {
    interface HTMLElementTagNameMap {
        'custom-validator-workspace-view': CustomValidatorWorkspaceView;
    }
}
