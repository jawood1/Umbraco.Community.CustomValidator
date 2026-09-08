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

	constructor(
		host: UmbControllerHost,
		variantId?: UmbVariantId
	) {
		super(host);
		this.#variantId = variantId;
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

		// Resolve the path for every distinct property alias concurrently, instead of awaiting
		// them one at a time — property-structure lookups are independent of one another.
		// A message may target more than one alias (its own propertyAlias PLUS any related
		// aliases), so collect the full flattened set across all messages before resolving.
		const aliases = [...new Set(messages.flatMap((m) => this.#targetAliases(m)))];
		const paths = await Promise.all(aliases.map((alias) => this.#buildPathForAlias(alias)));
		const pathByAlias = new Map(aliases.map((alias, i) => [alias, paths[i]]));

		for (const msg of messages) {
			for (const alias of this.#targetAliases(msg)) {
				const path = pathByAlias.get(alias);
				if (!path) continue;

				this.#validationContext.messages.addMessage('customValidator', path, msg.message);

				// Multiple messages can target the same property alias — only set up the
				// path/watcher once per alias (the path is identical for all of them, since it's
				// derived from the alias + this validator's own variant, not the message content).
				if (!this.#ownPaths.has(alias)) {
					this.#ownPaths.set(alias, path);

					// Watch this specific property's value (for our own variant only) so that
					// editing THIS property clears ONLY its own badge — not any other related
					// property's, and not this property's message for any OTHER variant/pane.
					void this.#watchPropertyForClear(alias, path);
				}
			}
		}
	}

	/** All property aliases a message's inline badge should be applied to: its own alias plus any related aliases. */
	#targetAliases(msg: ValidationMessage): string[] {
		return [...new Set([msg.propertyAlias, ...(msg.relatedPropertyAliases ?? [])].filter((a): a is string => !!a))];
	}

	/** Builds the exact validation-message path for a property alias, for this validator's own variant. */
	async #buildPathForAlias(propertyAlias: string): Promise<string> {
		const workspace = this.#contentWorkspace;
		if (!workspace) {
			// Should never happen — callers only invoke this while #contentWorkspace is set.
			throw new Error('CustomValidationVariantValidator: content workspace unavailable');
		}

		// Check if this property varies by culture, so we build the correct path:
		// culture-varied properties use this variant's culture; invariant properties
		// always use null. The result is cached per alias since property structure doesn't
		// change mid-session, avoiding a repeat structure lookup on every revalidate cycle.
		let variesByCulture = this.#variesByCultureCache.get(propertyAlias);
		if (variesByCulture === undefined) {
			const obs = await workspace.structure.propertyStructureByAlias(propertyAlias);
			const propType = await firstValueFrom(obs, { defaultValue: undefined });
			// If the property structure is unknown, assume it varies by culture (matches this
			// validator's own variant) rather than forcing an invariant (null-culture) path.
			variesByCulture = propType !== undefined ? (propType.variesByCulture ?? false) : true;
			this.#variesByCultureCache.set(propertyAlias, variesByCulture);
		}

		const culture = variesByCulture ? (this.#variantId?.culture ?? null) : null;

		return `$.values[${UmbDataPathPropertyValueQuery({
			alias: propertyAlias,
			culture,
			segment: this.#variantId?.segment ?? null,
		})}].value`;
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
