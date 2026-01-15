import { customElement, state, html, nothing, repeat, type PropertyValues } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { UmbTextStyles } from '@umbraco-cms/backoffice/style';
import { UMB_CONTENT_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/content';
import { UMB_NOTIFICATION_CONTEXT } from '@umbraco-cms/backoffice/notification';
import type { UmbWorkspaceViewElement } from '@umbraco-cms/backoffice/workspace';
import { VALIDATION_WORKSPACE_CONTEXT } from './validation-workspace-context.js';
import type { ValidationResult, ValidationMessage, ValidationSeverity, NotificationColor } from './types.js';

// Typed constants for delays
const SAVE_DELAY_MS = 500;
const INITIAL_VALIDATION_DELAY_MS = 1000;
const INSTANCE_RESET_DELAY_MS = 2000;

// Type-safe severity order for sorting
const SEVERITY_ORDER: Record<ValidationSeverity, number> = {
    Error: 0,
    Warning: 1,
    Info: 2
} as const;

// Type-safe severity to color mapping
const SEVERITY_COLOR_MAP: Record<ValidationSeverity, NotificationColor> = {
    Error: 'danger',
    Warning: 'warning',
    Info: 'default'
} as const;

// Module-level map to track which documents have been validated
const validatedDocuments = new Map<string, boolean>();

// Track instance registration order for split view detection
let instanceCounter = 0;

@customElement('custom-validator-workspace-view')
export class CustomValidatorWorkspaceView extends UmbLitElement implements UmbWorkspaceViewElement {
    #instanceId: number;
    @state()
    private _documentId?: string;

    @state()
    private _validationResult?: ValidationResult;

    @state()
    private _isValidating = false;

    @state()
    private _currentCulture?: string;

    // Cached computed properties for performance (memoization)
    @state()
    private _sortedMessages?: ValidationMessage[];

    @state()
    private _messageCounts?: { errors: number; warnings: number };

    #contentWorkspace?: typeof UMB_CONTENT_WORKSPACE_CONTEXT.TYPE;
    #currentDocumentId?: string;

    constructor() {
        super();
        
        // Assign unique instance ID for split view detection
        this.#instanceId = instanceCounter++;
        // Reset counter after a delay (new document or view changes)
        setTimeout(() => { if (instanceCounter > 1) instanceCounter = 0; }, INSTANCE_RESET_DELAY_MS);

        this.#setupWorkspaceObservers();
        this.#setupValidationObservers();
    }

    #setupWorkspaceObservers() {
        this.consumeContext(UMB_CONTENT_WORKSPACE_CONTEXT, (workspace) => {
            if (!workspace) return;
            this.#contentWorkspace = workspace;
            this.#observeVariants(workspace);
            this.#observeDocumentChanges(workspace);
        });
    }

    #observeVariants(workspace: typeof UMB_CONTENT_WORKSPACE_CONTEXT.TYPE) {
        this.observe(
            workspace.splitView.activeVariantsInfo,
            async (variants) => {
                if (variants && variants.length > 0) {
                    const variantIndex = this.#getVariantIndex(variants.length);
                    const variant = variants[variantIndex];
                    const newCulture = variant?.culture ?? undefined;
                    
                    // Only update if culture actually changed
                    if (this._currentCulture !== newCulture) {
                        this._currentCulture = newCulture;
                        await this.#loadCachedValidationResult();
                    }
                } else {
                    this._currentCulture = undefined;
                }
            }
        );
    }

    #getVariantIndex(variantCount: number): number {
        // Use instance ID to determine which variant this view represents
        // In split view: instance 0 = variant 0, instance 1 = variant 1
        // In single view: always use first variant
        return variantCount > 1 ? Math.min(this.#instanceId, variantCount - 1) : 0;
    }

    #observeDocumentChanges(workspace: typeof UMB_CONTENT_WORKSPACE_CONTEXT.TYPE) {
        this.observe(
            workspace.unique,
            async (unique) => {
                const isDocumentSwitch = this.#isDocumentSwitch(unique);
                
                this._documentId = unique ?? undefined;
                this.#currentDocumentId = unique ?? undefined;

                // Clear validation results when switching documents
                await this.#clearValidationOnDocumentSwitch();
                
                // Only reset validation flag when truly switching between different documents
                if (isDocumentSwitch && unique) {
                    validatedDocuments.delete(unique);
                }
            }
        );
    }

    #isDocumentSwitch(newDocumentId: string | null | undefined): boolean {
        return this.#currentDocumentId !== undefined && this.#currentDocumentId !== newDocumentId;
    }

    async #clearValidationOnDocumentSwitch() {
        try {
            const validationContext = await this.getContext(VALIDATION_WORKSPACE_CONTEXT);
            if (validationContext) {
                validationContext.clearValidation();
            }
        } catch (error) {
            console.error('Failed to clear validation on document switch:', error);
        }
    }

    async #loadCachedValidationResult() {
        try {
            const validationContext = await this.getContext(VALIDATION_WORKSPACE_CONTEXT);
            if (validationContext) {
                this._validationResult = validationContext.getValidationResult(this._currentCulture);
            }
        } catch (error) {
            console.error('Failed to load cached validation result:', error);
        }
    }

    #setupValidationObservers() {
        this.consumeContext(VALIDATION_WORKSPACE_CONTEXT, (validationContext) => {
            if (!validationContext) return;

            this.observe(
                validationContext.isValidating,
                (isValidating) => {
                    this._isValidating = isValidating;
                }
            );
        });
    }

    override willUpdate(changedProperties: PropertyValues) {
        super.willUpdate(changedProperties);
        
        // Recalculate cached computed properties when validation result changes
        if (changedProperties.has('_validationResult')) {
            this._sortedMessages = this.#sortMessagesBySeverity();
            this._messageCounts = this.#getMessageCounts();
        }
    }

    override connectedCallback() {
        super.connectedCallback();
        
        const hasValidatedOnce = this._documentId ? validatedDocuments.get(this._documentId) ?? false : false;
        
        // Validate when tab becomes visible
        if (this._documentId) {
            if (!hasValidatedOnce) {
                validatedDocuments.set(this._documentId, true);
                // Skip save on initial load to avoid triggering save modal
                this.#validateAndUpdateResult({ useDelay: true, skipSave: true });
            } else {
                this.#validateAndUpdateResult({ skipSave: true });
            }
        }
    }

    override disconnectedCallback() {
        super.disconnectedCallback();
        // Clean up cached state when component is removed
        this._sortedMessages = undefined;
        this._messageCounts = undefined;
    }

    // Unified validation method replacing all duplicate validation logic
    async #validateAndUpdateResult(options: { useDelay?: boolean; skipSave?: boolean } = {}) {
        if (!this._documentId) return;
        if (this._validationResult?.hasValidator === false) return;

        try {
            const validationContext = await this.getContext(VALIDATION_WORKSPACE_CONTEXT);
            if (!validationContext) return;

            const performValidation = async () => {
                try {
                    // Save before validation unless explicitly skipped
                    if (!options.skipSave && this.#contentWorkspace?.requestSubmit) {
                        await this.#contentWorkspace.requestSubmit();
                        await this.#delay(SAVE_DELAY_MS);
                    }
                    
                    await validationContext.validateManually(this._documentId!, this._currentCulture);
                    this._validationResult = validationContext.getValidationResult(this._currentCulture);
                } catch (error) {
                    console.debug('Validation skipped:', error);
                }
            };

            // Use delay for initial validation to ensure workspace is fully loaded
            if (options.useDelay) {
                await this.#delay(INITIAL_VALIDATION_DELAY_MS);
            }
            
            await performValidation();
        } catch (error) {
            console.error('Failed to validate and update result:', error);
        }
    }

    #handleValidateClick = async () => {
        await this.#validateAndUpdateResult();
    };

    #handleSaveAndPublishClick = async () => {
        if (!this._documentId) return;
        if (this._validationResult?.hasValidator === false) return;

        try {
            // Validate first
            await this.#validateAndUpdateResult();

            // Check for blocking errors
            const validationContext = await this.getContext(VALIDATION_WORKSPACE_CONTEXT);
            if (validationContext?.hasBlockingErrors(this._currentCulture)) {
                await this.#showNotification('danger', 'Cannot Publish', 'Validation errors must be resolved first');
                return;
            }

            // Publish if no errors
            await this.#publishDocument();
        } catch (error) {
            await this.#showNotification(
                'danger',
                'Error',
                error instanceof Error ? error.message : 'Save and publish failed'
            );
        }
    };

    // Typed utility helpers
    #sortMessagesBySeverity(): ValidationMessage[] | undefined {
        if (!this._validationResult?.messages) return undefined;
        return [...this._validationResult.messages].sort((a, b) => 
            SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
        );
    }

    #getMessageCounts(): { errors: number; warnings: number } {
        if (!this._validationResult) {
            return { errors: 0, warnings: 0 };
        }
        return {
            errors: this._validationResult.messages.filter(m => m.severity === 'Error').length,
            warnings: this._validationResult.messages.filter(m => m.severity === 'Warning').length
        };
    }

    #hasErrorsOrWarnings(): boolean {
        return this._validationResult?.messages.some(
            m => m.severity === 'Error' || m.severity === 'Warning'
        ) ?? false;
    }

    async #showNotification(color: NotificationColor, headline: string, message: string) {
        try {
            const notificationContext = await this.getContext(UMB_NOTIFICATION_CONTEXT);
            notificationContext?.peek(color, {
                data: { headline, message }
            });
        } catch (error) {
            console.error('Failed to show notification:', error);
        }
    }

    async #publishDocument() {
        try {
            if (this.#contentWorkspace && 'publish' in this.#contentWorkspace && typeof this.#contentWorkspace.publish === 'function') {
                await this.#contentWorkspace.publish();
            }
        } catch (error) {
            console.error('Failed to publish document:', error);
            throw error;
        }
    }

    #delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    #getSeverityColor(severity: ValidationSeverity): NotificationColor {
        return SEVERITY_COLOR_MAP[severity];
    }

    #renderValidationResults() {
        if (this._isValidating || !this._validationResult) {
            return this.#renderLoadingState();
        }

        if (!this._validationResult.hasValidator) {
            return this.#renderNoValidatorState();
        }

        return html`
            <uui-box headline="Validation Results" headline-variant="h5">
                ${!this.#hasErrorsOrWarnings() ? this.#renderSuccessMessage() : nothing}
                <div>
                    ${repeat(
                        this._sortedMessages ?? [],
                        (msg) => msg.message,
                        (msg) => this.#renderValidationMessage(msg)
                    )}
                </div>
            </uui-box>
        `;
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

    #renderNoValidatorState() {
        return html`
            <uui-box headline="Status" headline-variant="h5">
                <p>No validation configured for this content type (${this._validationResult?.contentTypeAlias}).</p>
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

    #renderValidationMessage(msg: ValidationMessage) {
        const color = this.#getSeverityColor(msg.severity);
        return html`
            <p>
                <uui-tag color=${color} look="primary">
                    ${msg.severity}
                </uui-tag>
                ${msg.message}
            </p>
        `;
    }

    #renderHeader() {
        const { errors, warnings } = this._messageCounts ?? { errors: 0, warnings: 0 };

        return html`
            <div slot="headline">
                ${this.#renderHeaderIcon(errors)}
                Document Validation
            </div>
            <div slot="header-actions">
                ${errors > 0 ? html`
                    <uui-tag color="danger" look="primary">${errors}</uui-tag>
                ` : nothing}
                ${warnings > 0 ? html`
                    <uui-tag color="warning" look="primary">${warnings}</uui-tag>
                ` : nothing}
            </div>
        `;
    }

    #renderHeaderIcon(errorCount: number) {
        return errorCount > 0 
            ? html`<uui-icon name="icon-delete" style="color: var(--uui-color-danger);"></uui-icon>`
            : html`<uui-icon name="icon-check" style="color: var(--uui-color-positive);"></uui-icon>`;
    }

    #renderControls() {
        return html`
            <uui-button-group>
                <uui-button
                    look="primary"
                    color="default"
                    label="Save & Validate"
                    @click=${this.#handleValidateClick}
                    ?disabled=${!this._documentId || this._isValidating}>
                    Save & Validate
                </uui-button>
                <uui-button
                    look="primary"
                    color="positive"
                    label="Validate & Publish"
                    @click=${this.#handleSaveAndPublishClick}
                    ?disabled=${!this._documentId || this._isValidating}>
                    Validate & Publish
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
