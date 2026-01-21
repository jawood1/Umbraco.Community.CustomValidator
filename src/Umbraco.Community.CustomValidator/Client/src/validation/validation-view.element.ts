import { customElement, state, html, nothing, repeat, type PropertyValues } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { UmbTextStyles } from '@umbraco-cms/backoffice/style';
import { UMB_CONTENT_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/content';
import type { UmbWorkspaceViewElement } from '@umbraco-cms/backoffice/workspace';
import { VALIDATION_WORKSPACE_CONTEXT } from './validation-workspace-context.js';
import type { ValidationResult, ValidationMessage, NotificationColor } from './types.js';
import { ValidationSeverity } from './types.js';

// Typed constants for delays
const SAVE_DELAY_MS = 500;
const INITIAL_VALIDATION_DELAY_MS = 1000;

// Type-safe severity order for sorting
const SEVERITY_ORDER: Record<ValidationSeverity, number> = {
    [ValidationSeverity.Error]: 0,
    [ValidationSeverity.Warning]: 1,
    [ValidationSeverity.Info]: 2
} as const;

// Type-safe severity to color mapping
const SEVERITY_COLOR_MAP: Record<ValidationSeverity, NotificationColor> = {
    [ValidationSeverity.Error]: 'danger',
    [ValidationSeverity.Warning]: 'warning',
    [ValidationSeverity.Info]: 'default'
} as const;

// Module-level map to track which documents+cultures have been validated
// Key format: "documentId|culture" or "documentId|undefined" for invariant
const validatedDocuments = new Map<string, boolean>();

// Static array to track registration order of instances for split view
// const splitViewInstanceOrder: CustomValidatorWorkspaceView[] = [];

@customElement('custom-validator-workspace-view')
export class CustomValidatorWorkspaceView extends UmbLitElement implements UmbWorkspaceViewElement {
    #countContext?: typeof VALIDATION_WORKSPACE_CONTEXT.TYPE;
    
    @state()
    private count = 0;
    
    @state()
    private _documentId?: string;
    
    @state()
    private _validationResults: Record<string, ValidationResult> = {};
    
    @state()
    private _activeCulture?: string;
    
    @state()
    private _isValidating = false;
    
    @state()
    private _currentCulture?: string;
    
    @state()
    private _cultureReady = false;
    
    #contentWorkspace?: typeof UMB_CONTENT_WORKSPACE_CONTEXT.TYPE;
    #currentDocumentId?: string;
    #variantObserverSetup = false;
    
    constructor() {
        super();
    
        this.consumeContext(VALIDATION_WORKSPACE_CONTEXT, (instance) => {
            if (!instance) return;
            
            this.#countContext = instance;
            this.#observeCounter();
            instance.increment();
        });
        
        this.#setupWorkspaceObservers();
        this.#setupValidationObservers();
        window.addEventListener('custom-validator:validate-all', this.#onGlobalValidateAll);
    }
    
    #observeCounter(): void {
        if (!this.#countContext) return;
        this.observe(this.#countContext.counter, (count) => {
            // Convert 1-based counter to 0-based index
            this.count = count - 1;
            console.log('Instance index:', this.count, '(from counter:', count + ')');
            
            // Try to set up variant observer once we have the count
            this.#trySetupVariantObserver();
        });
    }
    
    #setupWorkspaceObservers() {
        this.consumeContext(UMB_CONTENT_WORKSPACE_CONTEXT, (workspace) => {
            if (!workspace) return;
            this.#contentWorkspace = workspace;
            this.#observeDocumentChanges(workspace);
            
            // Try to set up variant observer once we have the workspace
            this.#trySetupVariantObserver();
        });
    }
    
    #trySetupVariantObserver() {
        // Only set up once, and only when both workspace and count are ready
        if (this.#variantObserverSetup || !this.#contentWorkspace || this.count < 0) {
            return;
        }
        
        this.#variantObserverSetup = true;
        console.log('Setting up variant observer for instance:', this.count);
        this.#observeVariant(this.#contentWorkspace);
    }
    
    #observeVariant(workspace: typeof UMB_CONTENT_WORKSPACE_CONTEXT.TYPE) {
        console.log('Observing variant at index:', this.count);
        
        // Observe the variant for this specific instance (counter-based)
        this.observe(
            workspace.splitView.activeVariantByIndex(this.count),
            async (variant) => {
                const newCulture = variant?.culture ?? undefined;
                console.log(`Instance ${this.count} - Culture:`, newCulture, 'Variant:', variant);
                
                // Only update and reload if culture actually changed
                if (this._currentCulture !== newCulture) {
                    this._currentCulture = newCulture;
                    this._cultureReady = true;
                    await this.#loadCachedValidationResult();
                } else if (!this._cultureReady) {
                    this._cultureReady = true;
                }
            }
        );
    }

    #getValidationKey(): string | undefined {
        // Generate a unique key for tracking validation per document+culture
        if (!this._documentId) return undefined;
        return `${this._documentId}|${this._currentCulture ?? 'undefined'}`;
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
                
                // Only reset validation flags when truly switching between different documents
                if (isDocumentSwitch && unique) {
                    // Clear all validation flags for this document (all cultures)
                    const keysToDelete = Array.from(validatedDocuments.keys()).filter(key => key.startsWith(`${unique}|`));
                    keysToDelete.forEach(key => validatedDocuments.delete(key));
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
                // Load all cached results for all cultures
                const cultures = Object.keys(this._validationResults);
                const results: Record<string, ValidationResult> = {};
                for (const culture of cultures) {
                    const result = validationContext.getValidationResult(culture === 'default' ? undefined : culture);
                    if (result) results[culture] = result;
                }
                this._validationResults = results;
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
        }
    }

    override connectedCallback() {
        super.connectedCallback();
        
        // In split view, wait for culture to be ready before initial validation
        // The #observeVariants will trigger validation once culture is set
        if (!this._cultureReady) {
            return;
        }
        
        const validationKey = this.#getValidationKey();
        const hasValidatedOnce = validationKey ? validatedDocuments.get(validationKey) ?? false : false;
        
        // Validate when tab becomes visible
        if (this._documentId) {
            if (!hasValidatedOnce) {
                if (validationKey) {
                    validatedDocuments.set(validationKey, true);
                }
                // Skip save on initial load to avoid triggering save modal
                this.#validateAndUpdateResult({ useDelay: true, skipSave: true });
            } else {
                this.#validateAndUpdateResult({ skipSave: true });
            }
        }
    }

    override disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('custom-validator:validate-all', this.#onGlobalValidateAll);
        
        // Type-safe reset
        if (this.#countContext) {
            this.#countContext.reset();
        }
    }

    // Unified validation method for all cultures
    async #validateAndUpdateResult(options: { useDelay?: boolean; skipSave?: boolean } = {}) {
        if (!this._documentId) return;

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

                    // Detect split view: if more than one variant, validate all cultures at once
                    let allCultures: string[] | undefined = undefined;
                    const splitView = this.#contentWorkspace?.splitView;
                    let variants: any[] = [];
                    if (splitView && typeof splitView.activeVariantsInfo.subscribe === 'function') {
                        // Synchronously get the current value of the observable
                        splitView.activeVariantsInfo.subscribe((val: any[]) => { variants = val; }) ;
                    }
                    if (variants.length > 1) {
                        allCultures = variants.map((v: any) => v.culture ?? undefined);
                    }

                    const results = await validationContext.validateManually(this._documentId!, this._currentCulture, allCultures);
                    this._validationResults = results;
                    // Set active culture for rendering
                    this._activeCulture = this._currentCulture ?? 'default';
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
        // Validate this pane with save
        await this.#validateAndUpdateResult({ skipSave: false });
        // Dispatch global event so all panes validate (but skip save in others)
        window.dispatchEvent(new CustomEvent('custom-validator:validate-all', { detail: { skipSave: true } }));
    };

    #onGlobalValidateAll = async (event: Event) => {
        // Only validate if this pane is attached and has a document
        if (this.isConnected && this._documentId) {
            // If event has detail.skipSave, use it; otherwise default to true
            let skipSave = true;
            if (event instanceof CustomEvent && typeof event.detail?.skipSave === 'boolean') {
                skipSave = event.detail.skipSave;
            }
            await this.#validateAndUpdateResult({ skipSave });
        }
    }

    #getMessageCounts(cultures?: string[]): { errors: number; warnings: number } {
        // If cultures not provided, use all keys in _validationResults
        const toCount = cultures && cultures.length > 0 ? cultures : Object.keys(this._validationResults);
        let errors = 0;
        let warnings = 0;
        for (const culture of toCount) {
            const result = this._validationResults[culture];
            if (result) {
                errors += result.messages.filter((m: ValidationMessage) => m.severity === ValidationSeverity.Error).length;
                warnings += result.messages.filter((m: ValidationMessage) => m.severity === ValidationSeverity.Warning).length;
            }
        }
        return { errors, warnings };
    }

    #delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    #getSeverityColor(severity: ValidationSeverity): NotificationColor {
        return SEVERITY_COLOR_MAP[severity];
    }

    #renderValidationResults() {
        if (this._isValidating) {
            return this.#renderLoadingState();
        }
        const cultures = Object.keys(this._validationResults);
        if (cultures.length === 0) {
            return this.#renderLoadingState();
        }
        // In split view, show all cultures; in single view, show only the active culture
        const toRender = cultures.length > 1 ? cultures : [this._activeCulture ?? 'default'];
        return html`
            <div style="display: flex; gap: var(--uui-size-layout-1); flex-direction: column;">
                ${toRender.map(culture => {
                    const result = this._validationResults[culture];
                    if (!result) return nothing;
                    if (!result.hasValidator) {
                        return html`
                        <uui-box headline="Status" headline-variant="h5">
                            <p>No custom validation configured for this document.</p>
                        </uui-box>`;
                    }
                    const sortedMessages = [...result.messages].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
                    const hasErrorsOrWarnings = result.messages.some(m => m.severity === ValidationSeverity.Error || m.severity === ValidationSeverity.Warning);
                    return html`
                        <uui-box headline="Validation Results" headline-variant="h5">

                            ${culture !== "default" ? html`
                                <div slot="header-actions">
                                    <uui-tag color="default" look="primary">${culture}</uui-tag>
                                </div>` 
                            : nothing}

                            ${!hasErrorsOrWarnings ? this.#renderSuccessMessage() : nothing}
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
                            </uui-table>
                        </uui-box>
                    `;
                })}
            </div>
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

    #renderSuccessMessage() {
        return html`
            <p style="color: var(--uui-color-positive);">
                <uui-icon name="icon-check"></uui-icon>
                All validations passed successfully.
            </p>
        `;
    }

    #renderHeader() {
        // Show counts for all rendered cultures (split or single view)
        const cultures = Object.keys(this._validationResults);
        const toRender = cultures.length > 1 ? cultures : [this._activeCulture ?? 'default'];
        const { errors, warnings } = this.#getMessageCounts(toRender);

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
                ${this._isValidating ? html`<uui-loader></uui-loader>` : nothing}
            </uui-button-group>
        `;
    }

    override render() {
        // Show controls if any culture has a validator
        const shouldShowControls = Object.values(this._validationResults).some(r => r.hasValidator !== false);
        
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
