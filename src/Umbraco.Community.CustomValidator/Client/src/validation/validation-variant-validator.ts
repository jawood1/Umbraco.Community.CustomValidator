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
 * Self-contained per-variant validator (one per culture+segment combination). Fetches its
 * own validation result and injects messages into the native validation context at the
 * exact path for its variant, re-fetching on save/publish via `UmbEntityUpdatedEvent`.
 * Instances are fully independent (no shared/broadcast state), so split-view panes editing
 * different cultures never interfere with each other.
 *
 * Native message keys are kept STABLE across revalidate cycles (see `#messageKey` /
 * `#applyMessages`) and only INVARIANT properties are managed by a single "primary"
 * instance (see `#isPrimary`). Both exist to avoid a known Umbraco core bug where
 * churning/duplicating native hints in split view causes a stack overflow in its
 * hint-propagation controller (`hint.controller.ts`) — see README "Known Limitations".
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
	/** Stable message key -> path, for every native message currently applied (see `#messageKey`). */
	#appliedKeys = new Map<string, string>();
	/** Every alias with an active watcher — a superset of `#ownPaths`, since a watch-only alias may not be owned. */
	#watchedAliases = new Set<string>();
	/** propertyAlias -> variesByCulture, cached since property structure doesn't change mid-session. */
	#variesByCultureCache = new Map<string, boolean>();
	/** The blocking messages from this validator's most recent successful revalidate cycle. */
	#lastMessages: ValidationMessage[] = [];
	/**
	 * Set at the start of `destroy()`. Async continuations check this after their `await`
	 * and bail out if true, so a torn-down instance never mutates shared validation state
	 * on a delayed callback.
	 */
	#isDestroyed = false;
	/**
	 * Only the primary validator manages INVARIANT properties (culture is always null, so
	 * every variant would otherwise race on the same path — see class doc comment).
	 * Culture-varying properties are unaffected: every validator always owns its own path.
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
	 * Updates whether this validator is the primary owner of INVARIANT properties.
	 * Immediately re-applies the last-known message set on change, rather than waiting for
	 * the next revalidate cycle, so an invariant property's badge never goes owner-less
	 * between promotion/demotion and the next save.
	 */
	setIsPrimary(isPrimary: boolean) {
		if (this.#isPrimary === isPrimary) return;
		this.#isPrimary = isPrimary;
		void this.#applyMessages(this.#lastMessages);
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

			// Bail out if this validator was torn down (document/workspace switch) while the
			// request was in flight — applying messages now would mutate a validation context
			// that's being (or has already been) cleared, and nothing would ever clear it again.
			if (this.#isDestroyed) return;

			// A message is only treated as blocking (inline badge + submit-blocking) if it's an
			// Error, or a Warning while the backend's TreatWarningsAsErrors setting is enabled.
			// Info is never blocking. Mirrors the backend's own CustomValidationExtensions.IsError.
			const treatWarningsAsErrors = result?.treatWarningsAsErrors ?? false;
			const blockingMessages = (result?.messages ?? []).filter(
				(m) =>
					m.severity === ValidationSeverity.Error ||
					(m.severity === ValidationSeverity.Warning && treatWarningsAsErrors)
			);

			this.#lastMessages = blockingMessages;
			await this.#applyMessages(blockingMessages);
		} catch (error) {
			console.error('Validation failed for variant:', error);
		} finally {
			this.#isValidating = false;
		}
	}

	async #applyMessages(messages: ValidationMessage[]) {
		if (!this.#validationContext || !this.#contentWorkspace) return;

		if (messages.length === 0) {
			this.#clearAllOwnedAndWatched();
			return;
		}

		// Resolve each message's target aliases (own + related) once, reused across the passes below.
		const messageTargets = messages.map((msg) => ({ msg, targets: this.#targetAliases(msg) }));

		// Resolve path + variesByCulture for every distinct alias concurrently.
		const aliases = [...new Set(messageTargets.flatMap((mt) => mt.targets))];
		const resolved = await Promise.all(aliases.map((alias) => this.#resolveAlias(alias)));
		const resolvedByAlias = new Map(aliases.map((alias, i) => [alias, resolved[i]]));

		// Bail out if torn down while the lookups above were in flight.
		if (this.#isDestroyed) return;

		// Aliases this instance will actually own a message for. Only the primary validator
		// manages INVARIANT aliases (see #isPrimary) — every other validator skips them.
		const managedAliasSet = new Set<string>();
		for (const { targets } of messageTargets) {
			for (const alias of targets) {
				const info = resolvedByAlias.get(alias);
				if (!info) continue;
				if (!info.variesByCulture && !this.#isPrimary) continue;
				managedAliasSet.add(alias);
			}
		}

		// Build the set of native messages REQUIRED after this cycle, keyed by a STABLE
		// identity (alias + severity + body — see `#messageKey`) rather than a fresh random
		// key each cycle. This lets the diff below only remove/add the genuine delta, so an
		// unchanged message never disappears from the native messages array — avoiding the
		// native hint-churn that can overflow the call stack in split view (see class doc).
		const required = new Map<string, { alias: string; path: string; body: string }>();
		for (const { msg, targets } of messageTargets) {
			for (const alias of targets) {
				const info = resolvedByAlias.get(alias);
				if (!info || !managedAliasSet.has(alias)) continue;
				const key = this.#messageKey(alias, msg);
				required.set(key, { alias, path: info.path, body: msg.message });
			}
		}

		// Watchers are cheap Observable subscriptions, so they're rebuilt in full every cycle.
		for (const alias of this.#watchedAliases) {
			this.removeUmbControllerByAlias(this.#watcherAlias(alias));
		}
		this.#watchedAliases.clear();

		// Remove only messages no longer required (the actual delta).
		const staleKeys = [...this.#appliedKeys.keys()].filter((key) => !required.has(key));
		if (staleKeys.length > 0) {
			const stalePaths = new Set(staleKeys.map((key) => this.#appliedKeys.get(key)!));
			this.#validationContext.messages.removeMessageByKeys(staleKeys);
			for (const key of staleKeys) {
				this.#appliedKeys.delete(key);
			}
			// A path may still be required by a different still-required message — only
			// clear its stale `client` mirror once nothing remains there.
			for (const path of stalePaths) {
				this.#clearStaleClientMirrorIfPathEmpty(path);
			}
		}

		// Add (or safely no-op re-add) every currently-required message — addMessage() already
		// skips genuinely unchanged (type, path, body) triples, so this only does real work
		// for messages that are new this cycle. Batched into one notify cycle.
		this.#validationContext.messages.initiateChange();
		try {
			for (const [key, { path, body }] of required) {
				this.#validationContext.messages.addMessage('customValidator', path, body, key);
				this.#appliedKeys.set(key, path);
			}
		} finally {
			this.#validationContext.messages.finishChange();
		}

		// Rebuild #ownPaths (alias -> path, for the live-edit watcher system) from `required`.
		this.#ownPaths.clear();
		for (const { alias, path } of required.values()) {
			if (!this.#ownPaths.has(alias)) {
				this.#ownPaths.set(alias, path);
			}
		}

		// For every alias that's a target alongside one this instance owns, work out which
		// owned paths should clear when that alias's value changes ("watchAliasToOwnedSiblings").
		// The watched alias itself needn't be owned by this instance — e.g. a related
		// INVARIANT alias (owned only by the primary validator) is still observed read-only
		// by non-primary validators owning the culture-varying sibling, so fixing the shared
		// field clears every culture's copy of the co-badge too. Read-only observation never
		// reintroduces the multi-writer race #isPrimary guards against.
		const watchAliasToOwnedSiblings = new Map<string, Set<string>>();
		for (const { targets: allTargets } of messageTargets) {
			const ownedTargets = allTargets.filter((alias) => managedAliasSet.has(alias));
			if (ownedTargets.length === 0) continue;
			for (const watchAlias of allTargets) {
				const owned = watchAliasToOwnedSiblings.get(watchAlias) ?? new Set<string>();
				ownedTargets.forEach((t) => owned.add(t));
				watchAliasToOwnedSiblings.set(watchAlias, owned);
			}
		}

		// Set up exactly one watcher per distinct watched alias (owned or not), each clearing
		// every owned sibling it's associated with when that alias's value changes.
		for (const [watchAlias, ownedSiblings] of watchAliasToOwnedSiblings) {
			const info = resolvedByAlias.get(watchAlias);
			if (!info) continue;
			this.#watchedAliases.add(watchAlias);
			void this.#watchPropertyForClear(watchAlias, info.variesByCulture, ownedSiblings);
		}
	}

	/**
	 * Stable identity for a (alias, message) pairing, used as the native message's `key` so
	 * an unchanged validation concern keeps the exact same key across revalidate cycles
	 * instead of a fresh random one every time - see the detailed comment in `#applyMessages`.
	 */
	#messageKey(alias: string, msg: ValidationMessage): string {
		return `cv::${alias}::${msg.severity}::${msg.message}`;
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

		const cached = this.#variesByCultureCache.get(propertyAlias);
		if (cached !== undefined) return cached;

		const obs = await workspace.structure.propertyStructureByAlias(propertyAlias);
		const propType = await firstValueFrom(obs, { defaultValue: undefined });

		if (propType === undefined) {
			// Structure not resolvable yet (e.g. still loading right after opening the
			// document) — don't cache a guess, since a wrong "varies by culture" guess would
			// permanently break the live-edit watcher for an invariant property. Return the
			// uncached fallback; a later cycle resolves and caches the real value.
			return true;
		}

		const variesByCulture = propType.variesByCulture ?? false;
		this.#variesByCultureCache.set(propertyAlias, variesByCulture);
		return variesByCulture;
	}

	/**
	 * Observes a single property's value (scoped to this validator's variantId, or no
	 * variant filter for INVARIANT properties, which only ever have one culture:null entry).
	 * The first emission (current value on subscribe) is skipped — only a genuine edit
	 * triggers a clear. `watchAlias` doesn't have to be an alias this validator owns a
	 * message for — it may be watch-only (see #applyMessages). On a genuine change, clears
	 * every alias in `ownedAliasesToClear` this validator still owns, then stops watching.
	 */
	async #watchPropertyForClear(watchAlias: string, variesByCulture: boolean, ownedAliasesToClear: Set<string>) {
		if (!this.#contentWorkspace) return;

		const watchVariantId = variesByCulture ? this.#variantId : undefined;
		const obs = await this.#contentWorkspace.propertyValueByAlias(watchAlias, watchVariantId);
		if (!obs) return;

		// Bail out if torn down while the observable lookup above was in flight.
		if (this.#isDestroyed) return;

		let isFirstEmission = true;
		this.observe(
			obs,
			() => {
				if (isFirstEmission) {
					isFirstEmission = false;
					return;
				}

				// Value changed — clear every owned alias tied to this watched alias, batched
				// into a single native notify cycle.
				this.#validationContext?.messages.initiateChange();
				try {
					for (const alias of ownedAliasesToClear) {
						const path = this.#ownPaths.get(alias);
						if (!path) continue;
						this.#clearPathAndStaleClientMirror(path);
						this.#ownPaths.delete(alias);
					}
				} finally {
					this.#validationContext?.messages.finishChange();
				}

				// This watcher's job is done — a fresh one is set up next #applyMessages cycle if still relevant.
				this.#watchedAliases.delete(watchAlias);
				this.removeUmbControllerByAlias(this.#watcherAlias(watchAlias));
			},
			this.#watcherAlias(watchAlias)
		);
	}

	#watcherAlias(propertyAlias: string): string {
		return `_cvPropWatch_${propertyAlias}`;
	}

	#delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	override destroy() {
		// Set first, before anything else: any async continuation still in flight (see the
		// class doc comment on #isDestroyed) checks this immediately after its own await
		// point and bails out rather than mutating state on behalf of an instance that's
		// being torn down right now.
		this.#isDestroyed = true;

		if (this.#actionEventContext) {
			this.#actionEventContext.removeEventListener(
				UmbEntityUpdatedEvent.TYPE,
				this.#onEntityUpdated
			);
		}
		// Remove any owned messages and watchers before teardown. Watcher controllers are
		// also auto-cleaned on host disconnect, but removed explicitly here for clarity.
		this.#clearAllOwnedAndWatched();
		this.#validationContext = undefined;
		this.#contentWorkspace = undefined;
		this.#actionEventContext = undefined;
		super.destroy();
	}

	/**
	 * Removes every message and watcher this instance owns, then resets bookkeeping.
	 * Shared by `#applyMessages` (full refresh) and `destroy()` (final teardown) — both need
	 * identical cleanup. Batched into a single native notify cycle.
	 */
	#clearAllOwnedAndWatched() {
		this.#validationContext?.messages.initiateChange();
		try {
			for (const path of this.#ownPaths.values()) {
				this.#clearPathAndStaleClientMirror(path);
			}
			for (const alias of this.#watchedAliases) {
				this.removeUmbControllerByAlias(this.#watcherAlias(alias));
			}
		} finally {
			this.#validationContext?.messages.finishChange();
		}
		this.#ownPaths.clear();
		this.#watchedAliases.clear();
		this.#appliedKeys.clear();
	}

	/**
	 * Removes our own `customValidator` message at `path`, then — if nothing else remains
	 * there — also removes any lingering `client`-type message at the same path.
	 *
	 * This compensates for a gap in Umbraco's own `UmbFormControlValidator`: it mirrors any
	 * non-`client` message into its own `client`-type message so the native form control
	 * shows invalid, but skips removing that mirror on disconnect. If the property's DOM
	 * element disconnects before its own reactive cleanup runs, the mirror is orphaned and
	 * alone can block Save/Publish even after our message is gone. We only remove it once no
	 * other (non-`client`) message remains at the path, so a genuine unrelated native
	 * failure (e.g. a "mandatory field" check) at the same path is never masked.
	 */
	#clearPathAndStaleClientMirror(path: string) {
		if (!this.#validationContext) return;

		this.#validationContext.messages.removeMessagesByTypeAndPath('customValidator', path);
		this.#forgetAppliedKeysAtPath(path);

		this.#clearStaleClientMirrorIfPathEmpty(path);
	}

	/**
	 * If no non-`client` message remains at `path`, removes any lingering `client`-type
	 * mirror too (see `#clearPathAndStaleClientMirror`). Split out so `#applyMessages`'s
	 * key-based diff can batch-remove stale `customValidator` messages first, then check per
	 * affected path whether the mirror is now also safe to remove.
	 */
	#clearStaleClientMirrorIfPathEmpty(path: string) {
		if (!this.#validationContext) return;

		const remaining = this.#validationContext.messages
			.getMessages()
			.some((m) => m.type !== 'client' && m.path === path);
		if (!remaining) {
			this.#validationContext.messages.removeMessagesByTypeAndPath('client', path);
		}
	}

	/** Removes every `#appliedKeys` entry pointing at `path` (used when a path is cleared as a whole). */
	#forgetAppliedKeysAtPath(path: string) {
		for (const [key, keyPath] of this.#appliedKeys) {
			if (keyPath === path) {
				this.#appliedKeys.delete(key);
			}
		}
	}
}
