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
	/** Paths this validator has previously added messages to, so we can clear only our own. */
	#ownPaths = new Set<string>();

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
			await this.#applyMessages(result?.messages);
		} catch (error) {
			console.error('Validation failed for variant:', error);
		} finally {
			this.#isValidating = false;
		}
	}

	async #applyMessages(messages?: Array<{ message: string; propertyAlias?: string; severity?: string }>) {
		if (!this.#validationContext || !this.#contentWorkspace) return;

		// Clear only the messages this validator previously added, so we never touch other
		// variants'/validators' messages (this is what keeps split-view panes isolated).
		for (const path of this.#ownPaths) {
			this.#validationContext.messages.removeMessagesByTypeAndPath('customValidator', path);
		}
		this.#ownPaths.clear();

		if (!messages || messages.length === 0) return;

		for (const msg of messages) {
			if (!msg.propertyAlias) continue;

			// Check if this property varies by culture, so we build the correct path:
			// culture-varied properties use this variant's culture; invariant properties
			// always use null.
			const obs = await this.#contentWorkspace.structure.propertyStructureByAlias(msg.propertyAlias);
			const propType = await firstValueFrom(obs, { defaultValue: undefined });

			const culture = propType !== undefined
				? (propType.variesByCulture ? (this.#variantId?.culture ?? null) : null)
				: (this.#variantId?.culture ?? null);

			const path = `$.values[${UmbDataPathPropertyValueQuery({
				alias: msg.propertyAlias,
				culture,
				segment: this.#variantId?.segment ?? null,
			})}].value`;

			this.#validationContext.messages.addMessage('customValidator', path, msg.message);
			this.#ownPaths.add(path);
		}
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
		// Remove any messages this validator owns before it is torn down (variant removed / doc switched).
		for (const path of this.#ownPaths) {
			this.#validationContext?.messages.removeMessagesByTypeAndPath('customValidator', path);
		}
		this.#ownPaths.clear();
		this.#validationContext = undefined;
		this.#contentWorkspace = undefined;
		this.#actionEventContext = undefined;
		super.destroy();
	}
}
