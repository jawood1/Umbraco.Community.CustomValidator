import { UmbContextBase } from '@umbraco-cms/backoffice/class-api';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import { ValidationApiService } from '../apis/validation-api.service.js';
import type { ValidationResult, ValidationMessage } from '../validation/types.js';
import { UmbContextToken } from '@umbraco-cms/backoffice/context-api';
import { UmbObjectState, UmbNumberState } from '@umbraco-cms/backoffice/observable-api';
import { UMB_VALIDATION_CONTEXT, UmbDataPathPropertyValueQuery } from '@umbraco-cms/backoffice/validation';
import { UMB_CONTENT_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/content';
import { firstValueFrom } from '@umbraco-cms/backoffice/external/rxjs';

const AUTO_VALIDATE_DELAY_MS = 500;

export const VALIDATION_WORKSPACE_CONTEXT = new UmbContextToken<ValidationWorkspaceContext>(
    'UmbWorkspaceContext',
    'ValidationWorkspaceContext'
);

export class ValidationWorkspaceContext extends UmbContextBase {
    #apiService = new ValidationApiService(this);
    #isValidating = new UmbObjectState<boolean>(false);
    #lastResult = new UmbObjectState<ValidationResult | undefined>(undefined);
    #nativeValidationContext?: typeof UMB_VALIDATION_CONTEXT.TYPE;
    #contentWorkspace?: typeof UMB_CONTENT_WORKSPACE_CONTEXT.TYPE;
    #documentId?: string;
    #activeCulture?: string;
    /** Skip the initial workspace.data emission so we don't clear messages before auto-validation runs. */
    #hasReceivedInitialData = false;
    /** Pending auto-validation timer — debounced so the culture observer can update #activeCulture first. */
    #autoValidateTimer?: ReturnType<typeof setTimeout>;

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
                }

                if (this.#documentId) {
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
        super.destroy();
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

    incrementInstance() {
        this.#istanceCounter.setValue(this.#istanceCounter.value + 1);
    }

    resetInstanceCounter() {
        this.#istanceCounter.setValue(0);
    }

    async validateManually(documentId: string, culture?: string): Promise<ValidationResult> {
        this.#isValidating.setValue(true);
        try {
            const result = await this.#apiService.validateDocument(documentId, culture);
            this.#lastResult.setValue(result);
            await this.#pushInlineValidationMessages(result.messages ?? [], culture);
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

    async #pushInlineValidationMessages(messages: ValidationMessage[], culture?: string) {
        if (!this.#nativeValidationContext || !this.#contentWorkspace) return;

        this.#nativeValidationContext.messages.removeMessagesByType('customValidator');

        for (const msg of messages) {
            if (!msg.propertyAlias) continue;

            // Use the culture exactly as received — do NOT normalise casing.
            // UmbVariantId stores culture as-is (e.g. 'en-US'), and filterMsgByVariantId does a
            // case-sensitive string comparison. Lowercasing would produce 'en-us' which wouldn't
            // match variantId.culture = 'en-US', causing the variant filter to reject our messages.
            //
            // Query the content type structure to determine whether this property varies by culture.
            // Following the official Umbraco example pattern — this lets us construct exactly one
            // correct path instead of a dual-path workaround.
            const obs = await this.#contentWorkspace.structure.propertyStructureByAlias(msg.propertyAlias);
            const propType = await firstValueFrom(obs, { defaultValue: undefined });

            if (propType !== undefined) {
                // Property structure is known — build exactly one correct path.
                const resolvedCulture = msg.culture ?? (propType.variesByCulture ? (culture ?? null) : null);
                const path = `$.values[${UmbDataPathPropertyValueQuery({
                    alias: msg.propertyAlias,
                    culture: resolvedCulture,
                    segment: null,
                })}].value`;
                this.#nativeValidationContext.messages.addMessage('customValidator', path, msg.message);
            } else {
                // Property structure unknown — fall back to dual-path so the badge appears
                // regardless of whether the property is invariant or culture-varied.
                const resolvedCulture = msg.culture ?? culture ?? null;
                const primaryPath = `$.values[${UmbDataPathPropertyValueQuery({
                    alias: msg.propertyAlias,
                    culture: resolvedCulture,
                    segment: null,
                })}].value`;
                this.#nativeValidationContext.messages.addMessage('customValidator', primaryPath, msg.message);
                if (resolvedCulture !== null) {
                    const nullCulturePath = `$.values[${UmbDataPathPropertyValueQuery({
                        alias: msg.propertyAlias,
                        culture: null,
                        segment: null,
                    })}].value`;
                    this.#nativeValidationContext.messages.addMessage('customValidator', nullCulturePath, msg.message);
                }
            }
        }
    }
}

export { ValidationWorkspaceContext as api };
