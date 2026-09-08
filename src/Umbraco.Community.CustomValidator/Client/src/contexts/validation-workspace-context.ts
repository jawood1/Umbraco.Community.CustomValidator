import { UmbContextBase } from '@umbraco-cms/backoffice/class-api';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import { ValidationApiService } from '../apis/validation-api.service.js';
import type { ValidationResult } from '../validation/types.js';
import { UmbContextToken } from '@umbraco-cms/backoffice/context-api';
import { UmbObjectState, UmbNumberState } from '@umbraco-cms/backoffice/observable-api';
import { UMB_VALIDATION_CONTEXT } from '@umbraco-cms/backoffice/validation';
import { UMB_CONTENT_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/content';
import { UmbVariantId } from '@umbraco-cms/backoffice/variant';
import { CustomValidationVariantValidator } from '../validation/validation-variant-validator.js';

export const VALIDATION_WORKSPACE_CONTEXT = new UmbContextToken<ValidationWorkspaceContext>(
    'UmbWorkspaceContext',
    'ValidationWorkspaceContext'
);

/**
 * Workspace context for custom validation.
 *
 * This context is a thin lifecycle manager: it exposes the shared API service and a
 * shared `isValidating` flag, tracks the split-view pane instance counter (used by the
 * tab view to know which pane it is), and creates/destroys one self-contained
 * `CustomValidationVariantValidator` per variant (culture + segment).
 *
 * It intentionally holds NO shared validation result state. Each consumer (the
 * Validation tab view, and each per-variant validator) fetches and owns its own result
 * independently — this matches the official Umbraco example pattern
 * (examples/custom-validation-workspace-context) and keeps split-view panes isolated
 * from one another (see plan.md for the bug history this fixes).
 */
export class ValidationWorkspaceContext extends UmbContextBase {
    #apiService = new ValidationApiService(this);
    #isValidating = new UmbObjectState<boolean>(false);
    #nativeValidationContext?: typeof UMB_VALIDATION_CONTEXT.TYPE;
    #contentWorkspace?: typeof UMB_CONTENT_WORKSPACE_CONTEXT.TYPE;
    #documentId?: string;
    /** Map of validator aliases to their instances (for cleanup) */
    #validators = new Map<string, CustomValidationVariantValidator>();

    #istanceCounter = new UmbNumberState(0);
    readonly instanceCounter = this.#istanceCounter.asObservable();
    public readonly isValidating = this.#isValidating.asObservable();

    constructor(host: UmbControllerHost) {
        super(host, VALIDATION_WORKSPACE_CONTEXT);

        this.consumeContext(UMB_VALIDATION_CONTEXT, (context) => {
            if (!context) return;
            this.#nativeValidationContext = context;
        });

        this.consumeContext(UMB_CONTENT_WORKSPACE_CONTEXT, (workspace) => {
            if (!workspace) return;
            this.#contentWorkspace = workspace;

            // Watch the document ID so we can (re)create per-variant validators on open/switch.
            this.observe(workspace.unique, (unique) => {
                const isSwitch = this.#documentId !== undefined && this.#documentId !== (unique ?? undefined);
                this.#documentId = unique ?? undefined;

                if (isSwitch) {
                    this.clearInlineMessages();
                    this.#destroyAllValidators();
                }

                if (this.#documentId) {
                    this.#setupValidatorsForDocument();
                }
            }, '_cvDocumentId');

            // NOTE: previously there was a blanket observer here on the whole `workspace.data`
            // object that cleared ALL inline messages (removeMessagesByType) on ANY property
            // edit, anywhere in the document. That was a bug of ours, not Umbraco's intended
            // behavior — the official Umbraco example scopes clearing to one specific property
            // + variant via propertyValueByAlias/removeMessagesByTypeAndPath. That granular
            // clearing now lives in CustomValidationVariantValidator (per-property, per-variant),
            // so no document-wide clear-on-edit observer is needed here.
        });
    }

    override destroy() {
        this.#destroyAllValidators();
        super.destroy();
    }

    /**
     * Set up one self-contained validator per variant (culture + segment). Each validator
     * fetches and manages its own validation result — see CustomValidationVariantValidator.
     */
    #setupValidatorsForDocument() {
        if (!this.#contentWorkspace || !this.#documentId) return;

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

    incrementInstance() {
        this.#istanceCounter.setValue(this.#istanceCounter.value + 1);
    }

    resetInstanceCounter() {
        this.#istanceCounter.setValue(0);
    }

    /**
     * Manually validate a document for a specific culture. Returns the result to the
     * caller — it is not written to any shared state, so callers (tab view panes,
     * variant validators) each own and render their own result independently.
     */
    async validateManually(documentId: string, culture?: string): Promise<ValidationResult> {
        this.#isValidating.setValue(true);
        try {
            return await this.#apiService.validateDocument(documentId, culture);
        } catch (error) {
            console.error('Manual validation failed:', error);
            throw error;
        } finally {
            this.#isValidating.setValue(false);
        }
    }

    /** Remove all inline badges added by this package. Called on document switch. */
    clearInlineMessages() {
        this.#nativeValidationContext?.messages.removeMessagesByType('customValidator');
    }
}

export { ValidationWorkspaceContext as api };
