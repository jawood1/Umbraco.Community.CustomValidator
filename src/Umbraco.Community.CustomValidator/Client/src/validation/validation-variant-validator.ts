import { UmbControllerBase } from '@umbraco-cms/backoffice/class-api';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import { UMB_CONTENT_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/content';
import {
	UMB_VALIDATION_CONTEXT,
	UmbDataPathPropertyValueQuery,
} from '@umbraco-cms/backoffice/validation';
import { UMB_ACTION_EVENT_CONTEXT } from '@umbraco-cms/backoffice/action';
import { UmbEntityUpdatedEvent } from '@umbraco-cms/backoffice/entity-action';
import type { UmbVariantId } from '@umbraco-cms/backoffice/variant';
import { firstValueFrom } from '@umbraco-cms/backoffice/external/rxjs';
import { ValidationApiService } from '../apis/validation-api.service.js';
import { ValidationSeverity, type ValidationMessage } from './types.js';

const ENTITY_UPDATED_DELAY_MS = 300;

/**
 * Self-contained per-variant validator for custom validation.
 *
 * This validator is responsible for a single variant (culture + segment combination).
 * It fetches its OWN validation result for its OWN culture, and injects validation
 * messages into the validation context with the exact path for that variant.
 *
 * It is fully self-driven: it fetches on creation, and re-fetches whenever the document
 * is saved/published (via its own `UmbEntityUpdatedEvent` listener). There is no external
 * broadcast or shared result relay — each variant instance is completely independent, so
 * split-view panes editing different cultures never interfere with one another.
 *
 * Pattern follows the official Umbraco example:
 * https://github.com/umbraco/Umbraco-CMS/blob/main/src/Umbraco.Web.UI.Client/examples/custom-validation-workspace-context/
 */
export class CustomValidationVariantValidator extends UmbControllerBase {
	#validationContext?: typeof UMB_VALIDATION_CONTEXT.TYPE;
	#contentWorkspace?: typeof UMB_CONTENT_WORKSPACE_CONTEXT.TYPE;
	#actionEventContext?: typeof UMB_ACTION_EVENT_CONTEXT.TYPE;
	#apiService: ValidationApiService;
	#variantId?: UmbVariantId;
	#isValidating = false;
	/** propertyAlias -> path, for messages this validator currently owns. */
	#ownPaths = new Map<string, string>();
	/** propertyAlias -> variesByCulture, cached since property structure doesn't change mid-session. */
	#variesByCultureCache = new Map<string, boolean>();
	/**
	 * Only the primary validator (one per document, see ValidationWorkspaceContext) manages
	 * INVARIANT properties. Every variant resolves an invariant property to the identical
	 * message path (culture is always null), so if every validator instance independently
	 * added/removed/watched it, they would race on the same path — which triggers a stack
	 * overflow in Umbraco's native hint propagation when the property is rendered in more
	 * than one split-view pane. Culture-varying properties are unaffected: every validator
	 * always owns its own path for those, regardless of this flag.
	 */
	#isPrimary: boolean;

	constructor(
		host: UmbControllerHost,
		variantId?: UmbVariantId,
		isPrimary = true
	) {
		super(host);
		this.#variantId = variantId;
		this.#isPrimary = isPrimary;
		this.#apiService = new ValidationApiService(this);

		this.consumeContext(UMB_VALIDATION_CONTEXT, (context) => {
			if (!context) return;
			this.#validationContext = context;
		});

		this.consumeContext(UMB_CONTENT_WORKSPACE_CONTEXT, async (workspace) => {
			if (!workspace) return;
			this.#contentWorkspace = workspace;

			// Kick off an initial validation once we know the document.
			void this.#revalidate();
		});

		this.consumeContext(UMB_ACTION_EVENT_CONTEXT, (context) => {
			if (!context) return;
			this.#actionEventContext = context;
			this.#actionEventContext.addEventListener(
				UmbEntityUpdatedEvent.TYPE,
				this.#onEntityUpdated
			);
		});
	}

	/**
	 * Updates whether this validator is the primary owner of INVARIANT properties (see the
	 * class doc comment on #isPrimary). If demoted from primary, immediately releases
	 * ownership of any invariant property it currently owns — the message itself is left in
	 * place (it's still valid and shared across variants), only this instance's own
	 * tracking/watcher is torn down, so the newly-primary validator can pick it up cleanly on
	 * its own next revalidate cycle without a duplicate-owner window.
	 */
	setIsPrimary(isPrimary: boolean) {
		if (this.#isPrimary === isPrimary) return;
		this.#isPrimary = isPrimary;
		if (!isPrimary) {
			void this.#releaseInvariantOwnership();
		}
	}

	async #releaseInvariantOwnership() {
		for (const alias of [...this.#ownPaths.keys()]) {
			const variesByCulture = await this.#resolveVariesByCulture(alias);
			if (!variesByCulture) {
				this.#ownPaths.delete(alias);
				this.removeUmbControllerByAlias(this.#watcherAlias(alias));
			}
		}
	}

	#onEntityUpdated = async (event: Event) => {
		if (!(event instanceof UmbEntityUpdatedEvent)) return;

		const eventUnique = event.getUnique();
		const documentUnique = this.#contentWorkspace?.getUnique();

		// Only re-validate if this event is for our current document.
		if (eventUnique === documentUnique) {
			// Wait for the backend cache to clear so we don't get a stale cached result.
			await this.#delay(ENTITY_UPDATED_DELAY_MS);
			await this.#revalidate();
		}
	};

	async #revalidate() {
		if (this.#isValidating) return;
		this.#isValidating = true;

		try {
			const documentId = this.#contentWorkspace?.getUnique();
			if (!documentId || !this.#validationContext || !this.#contentWorkspace) return;

			const result = await this.#apiService.validateDocument(documentId, this.#variantId?.culture ?? undefined);

			// A message is only treated as blocking (inline badge + submit-blocking) if it's an
			// Error, or a Warning while the backend's TreatWarningsAsErrors setting is enabled.
			// Info is never blocking. Mirrors the backend's own CustomValidationExtensions.IsError.
			const treatWarningsAsErrors = result?.treatWarningsAsErrors ?? false;
			const blockingMessages = (result?.messages ?? []).filter(
				(m) =>
					m.severity === ValidationSeverity.Error ||
					(m.severity === ValidationSeverity.Warning && treatWarningsAsErrors)
			);

			await this.#applyMessages(blockingMessages);
		} catch (error) {
			console.error('Validation failed for variant:', error);
		} finally {
			this.#isValidating = false;
		}
	}

	async #applyMessages(messages: ValidationMessage[]) {
		if (!this.#validationContext || !this.#contentWorkspace) return;

		// Full refresh: clear every message + property watcher this validator previously owned.
		// We never touch other variants'/validators' messages — this is what keeps split-view
		// panes isolated (Phase 1) as well as properties isolated from one another (Phase 2).
		for (const path of this.#ownPaths.values()) {
			this.#validationContext.messages.removeMessagesByTypeAndPath('customValidator', path);
		}
		for (const alias of this.#ownPaths.keys()) {
			this.removeUmbControllerByAlias(this.#watcherAlias(alias));
		}
		this.#ownPaths.clear();

		if (messages.length === 0) return;

		// Resolve the path + variesByCulture for every distinct property alias concurrently,
		// instead of awaiting them one at a time — property-structure lookups are independent
		// of one another. A message may target more than one alias (its own propertyAlias PLUS
		// any related aliases), so collect the full flattened set across all messages first.
		const aliases = [...new Set(messages.flatMap((m) => this.#targetAliases(m)))];
		const resolved = await Promise.all(aliases.map((alias) => this.#resolveAlias(alias)));
		const resolvedByAlias = new Map(aliases.map((alias, i) => [alias, resolved[i]]));

		for (const msg of messages) {
			for (const alias of this.#targetAliases(msg)) {
				const info = resolvedByAlias.get(alias);
				if (!info) continue;

				// Only the primary validator manages INVARIANT properties — every variant would
				// otherwise resolve the same property to the identical path and race to
				// add/remove/watch it independently (see class doc comment on #isPrimary).
				// Culture-varying properties are always owned by their own variant, unaffected.
				if (!info.variesByCulture && !this.#isPrimary) continue;

				this.#validationContext.messages.addMessage('customValidator', info.path, msg.message);

				// Multiple messages can target the same property alias — only set up the
				// path/watcher once per alias (the path is identical for all of them, since it's
				// derived from the alias + this validator's own variant, not the message content).
				if (!this.#ownPaths.has(alias)) {
					this.#ownPaths.set(alias, info.path);

					// Watch this specific property's value (for our own variant only) so that
					// editing THIS property clears ONLY its own badge — not any other related
					// property's, and not this property's message for any OTHER variant/pane.
					void this.#watchPropertyForClear(alias, info.path);
				}
			}
		}
	}

	/** All property aliases a message's inline badge should be applied to: its own alias plus any related aliases. */
	#targetAliases(msg: ValidationMessage): string[] {
		return [...new Set([msg.propertyAlias, ...(msg.relatedPropertyAliases ?? [])].filter((a): a is string => !!a))];
	}

	/** Resolves both the validation-message path and the variesByCulture flag for a property alias. */
	async #resolveAlias(propertyAlias: string): Promise<{ path: string; variesByCulture: boolean }> {
		const variesByCulture = await this.#resolveVariesByCulture(propertyAlias);
		const culture = variesByCulture ? (this.#variantId?.culture ?? null) : null;

		const path = `$.values[${UmbDataPathPropertyValueQuery({
			alias: propertyAlias,
			culture,
			segment: this.#variantId?.segment ?? null,
		})}].value`;

		return { path, variesByCulture };
	}

	/**
	 * Whether a property varies by culture, cached per alias since property structure doesn't
	 * change mid-session, avoiding a repeat structure lookup on every revalidate cycle.
	 */
	async #resolveVariesByCulture(propertyAlias: string): Promise<boolean> {
		const workspace = this.#contentWorkspace;
		if (!workspace) {
			// Should never happen — callers only invoke this while #contentWorkspace is set.
			throw new Error('CustomValidationVariantValidator: content workspace unavailable');
		}

		let variesByCulture = this.#variesByCultureCache.get(propertyAlias);
		if (variesByCulture === undefined) {
			const obs = await workspace.structure.propertyStructureByAlias(propertyAlias);
			const propType = await firstValueFrom(obs, { defaultValue: undefined });
			// If the property structure is unknown, assume it varies by culture (matches this
			// validator's own variant) rather than forcing an invariant (null-culture) path.
			variesByCulture = propType !== undefined ? (propType.variesByCulture ?? false) : true;
			this.#variesByCultureCache.set(propertyAlias, variesByCulture);
		}
		return variesByCulture;
	}

	/**
	 * Observes a single property's value (scoped to this validator's own variantId). The first
	 * emission is always the current value on subscribe, so it is skipped — only a genuine
	 * subsequent edit clears the message.
	 */
	async #watchPropertyForClear(propertyAlias: string, path: string) {
		if (!this.#contentWorkspace) return;

		const obs = await this.#contentWorkspace.propertyValueByAlias(propertyAlias, this.#variantId);
		if (!obs) return;

		let isFirstEmission = true;
		this.observe(
			obs,
			() => {
				if (isFirstEmission) {
					isFirstEmission = false;
					return;
				}

				// The value changed — clear only this property's message for this variant.
				this.#validationContext?.messages.removeMessagesByTypeAndPath('customValidator', path);
				this.#ownPaths.delete(propertyAlias);
				this.removeUmbControllerByAlias(this.#watcherAlias(propertyAlias));
			},
			this.#watcherAlias(propertyAlias)
		);
	}

	#watcherAlias(propertyAlias: string): string {
		return `_cvPropWatch_${propertyAlias}`;
	}

	#delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	override destroy() {
		if (this.#actionEventContext) {
			this.#actionEventContext.removeEventListener(
				UmbEntityUpdatedEvent.TYPE,
				this.#onEntityUpdated
			);
		}
		// Remove any messages + property watchers this validator owns before it is torn down
		// (variant removed / doc switched). Watcher controllers are also cleaned up automatically
		// by the framework on host disconnect, but we remove them explicitly for clarity.
		for (const [alias, path] of this.#ownPaths) {
			this.#validationContext?.messages.removeMessagesByTypeAndPath('customValidator', path);
			this.removeUmbControllerByAlias(this.#watcherAlias(alias));
		}
		this.#ownPaths.clear();
		this.#validationContext = undefined;
		this.#contentWorkspace = undefined;
		this.#actionEventContext = undefined;
		super.destroy();
	}
}
