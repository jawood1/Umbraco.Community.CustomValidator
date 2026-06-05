import { UmbContextBase } from '@umbraco-cms/backoffice/class-api';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import { ValidationApiService } from '../apis/validation-api.service.js';
import type { ValidationResult } from '../validation/types.js';
import { UmbContextToken } from '@umbraco-cms/backoffice/context-api';
import { UmbObjectState, UmbNumberState } from '@umbraco-cms/backoffice/observable-api';
import { UMB_VALIDATION_CONTEXT } from '@umbraco-cms/backoffice/validation';
import { UMB_CONTENT_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/content';
import { UMB_ACTION_EVENT_CONTEXT } from '@umbraco-cms/backoffice/action';
import { UmbEntityUpdatedEvent } from '@umbraco-cms/backoffice/entity-action';
import { UmbVariantId } from '@umbraco-cms/backoffice/variant';
import { firstValueFrom } from '@umbraco-cms/backoffice/external/rxjs';
import { CustomValidationVariantValidator } from '../validation/validation-variant-validator.js';

const AUTO_VALIDATE_DELAY_MS = 500;

export const VALIDATION_WORKSPACE_CONTEXT = new UmbContextToken<ValidationWorkspaceContext>(
    'UmbWorkspaceContext',
    'ValidationWorkspaceContext'
);

/**
 * Workspace context for custom validation.
 * 
 * This context manages the lifecycle of per-variant validators. Following the official
 * Umbraco pattern, we create one validator per variant (culture + segment) for properties
 * that vary by culture, and a single validator for invariant properties.
 * 
 * Each validator independently observes its variant's value and handles its own validation,
 * which fixes the culture-specific field issue.
 */
export class ValidationWorkspaceContext extends UmbContextBase {
    #apiService = new ValidationApiService(this);
    #isValidating = new UmbObjectState<boolean>(false);
    #lastResult = new UmbObjectState<ValidationResult | undefined>(undefined);
    #nativeValidationContext?: typeof UMB_VALIDATION_CONTEXT.TYPE;
    #contentWorkspace?: typeof UMB_CONTENT_WORKSPACE_CONTEXT.TYPE;
    #actionEventContext?: typeof UMB_ACTION_EVENT_CONTEXT.TYPE;
    #documentId?: string;
    #activeCulture?: string;
    /** Skip the initial workspace.data emission so we don't clear messages before auto-validation runs. */
    #hasReceivedInitialData = false;
    /** Pending auto-validation timer — debounced so the culture observer can update #activeCulture first. */
    #autoValidateTimer?: ReturnType<typeof setTimeout>;
    /** Map of validator aliases to their instances (for cleanup) */
    #validators = new Map<string, CustomValidationVariantValidator>();

    #istanceCounter = new UmbNumberState(0);
    readonly instanceCounter = this.#istanceCounter.asObservable();
    public readonly isValidating = this.#isValidating.asObservable();
    public readonly validationResult = this.#lastResult.asObservable();

    constructor(host: UmbControllerHost) {
        super(host, VALIDATION_WORKSPACE_CONTEXT);

        this.consumeContext(UMB_VALIDATION_CONTEXT, (context) => {
            if (!context) return;
            this.#nativeValidationContext = context;
        });

        this.consumeContext(UMB_ACTION_EVENT_CONTEXT, (context) => {
            if (!context) return;
            this.#actionEventContext = context;
            this.#actionEventContext.addEventListener(
                UmbEntityUpdatedEvent.TYPE,
                this.#onEntityUpdated
            );
        });

        this.consumeContext(UMB_CONTENT_WORKSPACE_CONTEXT, (workspace) => {
            if (!workspace) return;
            this.#contentWorkspace = workspace;

            // Watch the document ID so we can auto-validate on open and handle document switches.
            this.observe(workspace.unique, (unique) => {
                const isSwitch = this.#documentId !== undefined && this.#documentId !== (unique ?? undefined);
                this.#documentId = unique ?? undefined;

                if (isSwitch) {
                    this.clearInlineMessages();
                    this.#lastResult.setValue(undefined);
                    this.#destroyAllValidators();
                }

                if (this.#documentId) {
                    this.#setupValidatorsForDocument();
                    this.#scheduleAutoValidation();
                }
            }, '_cvDocumentId');

            // Track the primary variant culture so auto-validation uses the correct culture.
            this.observe(
                workspace.splitView.activeVariantByIndex(0),
                (variant) => {
                    const newCulture = variant?.culture ?? undefined;
                    const changed = this.#activeCulture !== newCulture;
                    this.#activeCulture = newCulture;
                    if (changed && this.#documentId) {
                        this.#scheduleAutoValidation();
                    }
                },
                '_cvActiveCulture'
            );

            // Clear stale inline messages when the user edits the document.
            // Umbraco's publish gate checks ALL validation context messages via getHasAnyMessages(),
            // so our messages must be cleared as soon as the user makes a change — otherwise a
            // previously-validated error will block Save & Publish even after the field is fixed.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const workspaceData = (workspace as any).data;
            if (workspaceData) {
                this.observe(
                    workspaceData,
                    (_data: unknown) => {
                        if (!this.#hasReceivedInitialData) {
                            this.#hasReceivedInitialData = true;
                            return;
                        }
                        this.clearInlineMessages();
                    },
                    '_cvDataChanged'
                );
            }
        });
    }

    override destroy() {
        if (this.#autoValidateTimer !== undefined) {
            clearTimeout(this.#autoValidateTimer);
        }
        if (this.#actionEventContext) {
            this.#actionEventContext.removeEventListener(
                UmbEntityUpdatedEvent.TYPE,
                this.#onEntityUpdated
            );
        }
        this.#destroyAllValidators();
        super.destroy();
    }

    /**
     * Set up per-variant validators for all properties that have validation rules.
     * Since we don't know which properties the validators care about at the context level,
     * we take a pragmatic approach: create validators for all properties that vary by culture,
     * plus an invariant validator.
     * 
     * The validators will ignore messages for properties they don't care about.
     */
    #setupValidatorsForDocument() {
        if (!this.#contentWorkspace || !this.#documentId) return;

        const documentId = this.#documentId;

        // We'll iterate through variant options and create validators
        // This happens after the document is loaded
        this.observe(
            this.#contentWorkspace.variantOptions,
            (variantOptions) => {
                if (!variantOptions) {
                    this.#destroyAllValidators();
                    return;
                }

                // Create validators for each variant
                const newValidators = new Map<string, CustomValidationVariantValidator>();

                for (const variantOption of variantOptions) {
                    const variantId = UmbVariantId.Create(variantOption);
                    const key = `${variantOption.culture ?? 'invariant'}`;

                    // Check if validator already exists
                    if (this.#validators.has(key)) {
                        const existing = this.#validators.get(key)!;
                        newValidators.set(key, existing);
                    } else {
                        // Create new validator for this variant
                        const validator = new CustomValidationVariantValidator(
                            this,
                            variantId
                        );
                        newValidators.set(key, validator);
                    }
                }

                // Destroy validators for variants that no longer exist
                for (const [key, validator] of this.#validators) {
                    if (!newValidators.has(key)) {
                        validator.destroy();
                    }
                }

                this.#validators = newValidators;
                
                // Trigger initial validation now that validators are ready
                // Pass the last result if available, or let validators work with empty result
                void this.#validateAllVariants(this.#lastResult.value);
            },
            '_cvVariantOptions'
        );
    }

    #destroyAllValidators() {
        for (const validator of this.#validators.values()) {
            validator.destroy();
        }
        this.#validators.clear();
    }

    async #validateAllVariants(result?: ValidationResult) {
        const validationPromises = Array.from(this.#validators.values()).map(v => v.validate(result));
        await Promise.all(validationPromises);
    }

    #scheduleAutoValidation() {
        // Debounce: cancel any pending timer so the culture observer always gets a chance to
        // update #activeCulture before validation runs. Without this, the unique observer fires
        // first (culture still undefined), and culture-specific property paths are built with
        // @.culture == null instead of @.culture == 'en-US', so their badges never appear.
        if (this.#autoValidateTimer !== undefined) {
            clearTimeout(this.#autoValidateTimer);
        }
        this.#autoValidateTimer = setTimeout(() => {
            this.#autoValidateTimer = undefined;
            void this.#runValidation();
        }, AUTO_VALIDATE_DELAY_MS);
    }

    async #runValidation(culture?: string) {
        if (!this.#documentId || this.#isValidating.value) return;
        await this.validateManually(this.#documentId, culture ?? this.#activeCulture);
    }

    #onEntityUpdated = async (event: Event) => {
        if (!(event instanceof UmbEntityUpdatedEvent)) return;
        
        const eventUnique = event.getUnique();
        const documentUnique = this.#contentWorkspace?.getUnique();
        
        // Only validate if this event is for our current document
        if (eventUnique === documentUnique && this.#documentId) {
            // Wait for backend cache to clear
            await this.#delay(300);
            
            // Clear old messages and re-validate
            this.clearInlineMessages();
            await this.validateManually(this.#documentId, this.#activeCulture);
        }
    };

    #delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    incrementInstance() {
        this.#istanceCounter.setValue(this.#istanceCounter.value + 1);
    }

    resetInstanceCounter() {
        this.#istanceCounter.setValue(0);
    }

    /**
     * Manually validate a document. This triggers validation on all variant validators
     * so they can inject messages for their specific variants.
     */
    async validateManually(documentId: string, culture?: string): Promise<ValidationResult> {
        this.#isValidating.setValue(true);
        try {
            const result = await this.#apiService.validateDocument(documentId, culture);
            this.#lastResult.setValue(result);
            
            // Trigger validation on all variant validators so they inject fresh messages
            // Pass the result so validators don't make duplicate API calls
            await this.#validateAllVariants(result);
            
            return result;
        } catch (error) {
            console.error('Manual validation failed:', error);
            throw error;
        } finally {
            this.#isValidating.setValue(false);
        }
    }

    /**
     * Called by the "Save & Validate" button. Optionally saves the document first,
     * then validates. The culture passed overrides the tracked active culture.
     */
    async triggerManualValidation(options: { culture?: string; withSave?: boolean } = {}) {
        if (!this.#documentId) return;

        try {
            if (options.withSave && this.#contentWorkspace?.requestSubmit) {
                await this.#contentWorkspace.requestSubmit();
            }
            await this.validateManually(this.#documentId, options.culture ?? this.#activeCulture);
        } catch (error) {
            console.error('Manual validation trigger failed:', error);
        }
    }

    /** Remove all inline badges added by this package. Called on document switch. */
    clearInlineMessages() {
        this.#nativeValidationContext?.messages.removeMessagesByType('customValidator');
    }
}

export { ValidationWorkspaceContext as api };
