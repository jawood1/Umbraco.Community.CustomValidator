import { UmbControllerBase } from '@umbraco-cms/backoffice/class-api';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import { UMB_CONTENT_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/content';
import {
	UMB_VALIDATION_CONTEXT,
	UmbDataPathPropertyValueQuery,
} from '@umbraco-cms/backoffice/validation';
import type { UmbVariantId } from '@umbraco-cms/backoffice/variant';
import { firstValueFrom } from '@umbraco-cms/backoffice/external/rxjs';

/**
 * Per-variant validator for custom validation.
 * 
 * This validator is responsible for a single variant (culture + segment combination).
 * It injects validation messages into the validation context with the exact path for that variant.
 * 
 * The workspace context is responsible for fetching validation results and passing them to
 * each validator so validators don't make duplicate API calls.
 * 
 * Pattern follows official Umbraco example:
 * https://github.com/umbraco/Umbraco-CMS/blob/release-17.4.2/src/Umbraco.Web.UI.Client/examples/custom-validation-workspace-context/
 */
export class CustomValidationVariantValidator extends UmbControllerBase {
	#validationContext?: typeof UMB_VALIDATION_CONTEXT.TYPE;
	#contentWorkspace?: typeof UMB_CONTENT_WORKSPACE_CONTEXT.TYPE;
	#variantId?: UmbVariantId;
	#isValidating = false;

	constructor(
		host: UmbControllerHost,
		variantId?: UmbVariantId
	) {
		super(host);
		this.#variantId = variantId;

		// Consume the validation context
		this.consumeContext(UMB_VALIDATION_CONTEXT, (context) => {
			if (!context) return;
			this.#validationContext = context;
		});

		// Consume the workspace context (for property structure lookup only)
		this.consumeContext(UMB_CONTENT_WORKSPACE_CONTEXT, async (workspace) => {
			if (!workspace) return;
			this.#contentWorkspace = workspace;
		});
	}

	/**
	 * Trigger validation for this variant with the given result.
	 * Called by the workspace context after fetching validation results.
	 */
	async validate(result?: { messages?: Array<{ message: string; propertyAlias?: string; severity?: string }> }) {
		this.#checkValidation(result);
	}

	#checkValidation(result?: { messages?: Array<{ message: string; propertyAlias?: string; severity?: string }> }) {
		if (this.#isValidating) return;
		this.#isValidating = true;

		void (async () => {
			try {
				if (!this.#validationContext || !this.#contentWorkspace) {
					return;
				}

				if (!result || !result.messages || result.messages.length === 0) {
					// No messages for this variant — clear any stale ones for this variant's paths
					return;
				}

				// For each message, inject with the correct path for this variant
				for (const msg of result.messages) {
					if (!msg.propertyAlias) continue;

					// Check if this property varies by culture
					const obs = await this.#contentWorkspace.structure.propertyStructureByAlias(msg.propertyAlias);
					const propType = await firstValueFrom(obs, { defaultValue: undefined });

					if (propType !== undefined) {
						// Property structure is known
						// For culture-varied properties, use this variant's culture
						// For invariant properties, always use null
						const culture = propType.variesByCulture ? (this.#variantId?.culture ?? null) : null;
						const path = `$.values[${UmbDataPathPropertyValueQuery({
							alias: msg.propertyAlias,
							culture,
							segment: this.#variantId?.segment ?? null,
						})}].value`;
						this.#validationContext.messages.addMessage('customValidator', path, msg.message);
					} else {
						// Property structure unknown — use this variant's exact path
						const path = `$.values[${UmbDataPathPropertyValueQuery({
							alias: msg.propertyAlias,
							culture: this.#variantId?.culture ?? null,
							segment: this.#variantId?.segment ?? null,
						})}].value`;
						this.#validationContext.messages.addMessage('customValidator', path, msg.message);
					}
				}
			} catch (error) {
				console.error('Validation failed for variant:', error);
			} finally {
				this.#isValidating = false;
			}
		})();
	}

	override destroy() {
		this.#validationContext = undefined;
		this.#contentWorkspace = undefined;
		super.destroy();
	}
}
