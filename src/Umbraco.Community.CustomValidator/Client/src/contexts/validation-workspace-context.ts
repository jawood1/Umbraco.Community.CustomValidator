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
 * A thin lifecycle manager: exposes the shared API service and `isValidating` flag, tracks
 * the split-view pane instance counter, and creates/destroys one self-contained
 * `CustomValidationVariantValidator` per variant (culture + segment).
 *
 * Holds no shared validation result state — each consumer (Validation tab view, each
 * per-variant validator) fetches and owns its own result, keeping split-view panes
 * isolated from one another.
 */
export class ValidationWorkspaceContext extends UmbContextBase {
    #apiService = new ValidationApiService(this);
    #isValidating = new UmbObjectState<boolean>(false);
    #nativeValidationContext?: typeof UMB_VALIDATION_CONTEXT.TYPE;
    #contentWorkspace?: typeof UMB_CONTENT_WORKSPACE_CONTEXT.TYPE;
    #documentId?: string;
    /** Map of validator aliases to their instances (for cleanup) */
    #validators = new Map<string, CustomValidationVariantValidator>();
    /**
     * Key of the validator currently designated primary owner of invariant properties.
     * Sticky: only reassigned if that validator no longer exists (its variant was removed),
     * not recomputed from array order every emission — that could cause spurious
     * demote/promote churn and briefly leave an invariant property without an owner.
     */
    #primaryKey?: string;

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

                // Create validators for each variant. Exactly one is marked "primary" and is
                // the sole owner of any INVARIANT property's message/watcher — otherwise every
                // variant would resolve an invariant property to the same message path and
                // race to add/remove it, which can overflow Umbraco's native hint propagation
                // when multiple split-view panes render the same property.
                //
                // The primary key is sticky (see field doc comment above).
                const keys = variantOptions.map((o) => `${o.culture ?? 'invariant'}`);
                if (!this.#primaryKey || !keys.includes(this.#primaryKey)) {
                    this.#primaryKey = keys[0];
                }

                const newValidators = new Map<string, CustomValidationVariantValidator>();

                variantOptions.forEach((variantOption) => {
                    const variantId = UmbVariantId.Create(variantOption);
                    const key = `${variantOption.culture ?? 'invariant'}`;
                    const isPrimary = key === this.#primaryKey;

                    // Check if validator already exists
                    if (this.#validators.has(key)) {
                        const existing = this.#validators.get(key)!;
                        existing.setIsPrimary(isPrimary);
                        newValidators.set(key, existing);
                    } else {
                        // Create new validator for this variant
                        const validator = new CustomValidationVariantValidator(
                            this,
                            variantId,
                            isPrimary
                        );
                        newValidators.set(key, validator);
                    }
                });

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
        this.#primaryKey = undefined;
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

    /**
     * Removes all inline badges added by this package, plus any now-orphaned `client`-type
     * message mirror left behind by Umbraco's own `UmbFormControlValidator` at the paths we
     * just cleared (see `CustomValidationVariantValidator.#clearPathAndStaleClientMirror`
     * for why these can be orphaned). Scoped only to paths our own `customValidator`
     * messages existed at — never a blanket sweep of every `client` message, since one can
     * also represent a genuine, unrelated native validation failure that must not be masked.
     */
    clearInlineMessages() {
        const context = this.#nativeValidationContext;
        if (!context) return;

        // Batch every mutation below into a single native notify cycle — a document switch
        // can clear many messages and their stale `client` mirrors at once; without batching,
        // each is its own mute->unmute->notify cycle, which in split view can compound into a
        // stack overflow via Umbraco's own hint-controller reentrancy.
        context.messages.initiateChange();
        try {
            const ownPaths = new Set(
                context.messages.getMessages()
                    .filter((m) => m.type === 'customValidator')
                    .map((m) => m.path)
            );
            context.messages.removeMessagesByType('customValidator');

            if (ownPaths.size === 0) return;

            const remaining = context.messages.getMessages();
            for (const path of ownPaths) {
                const stillHasNonClientMessage = remaining.some((m) => m.type !== 'client' && m.path === path);
                if (!stillHasNonClientMessage) {
                    context.messages.removeMessagesByTypeAndPath('client', path);
                }
            }
        } finally {
            context.messages.finishChange();
        }
    }
}

export { ValidationWorkspaceContext as api };
