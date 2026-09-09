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
	/**
	 * Stable message key -> path, for every native `customValidator` message this validator
	 * instance currently has applied (see `#messageKey`). Tracked so `#applyMessages` can
	 * diff against the newly-required message set on every revalidate cycle instead of
	 * unconditionally removing and re-adding everything — see the detailed comment in
	 * `#applyMessages` for why this matters (it eliminates most of the native hint churn
	 * that was triggering a split-view stack overflow in Umbraco's own hint propagation).
	 */
	#appliedKeys = new Map<string, string>();
	/**
	 * Every alias this validator currently has an active watcher on — a superset of
	 * `#ownPaths`' keys, since a validator may watch (read-only) a related alias it does
	 * NOT own the message for (e.g. a related INVARIANT alias only the primary validator
	 * owns), purely to know when to clear its OWN owned aliases. See #applyMessages.
	 */
	#watchedAliases = new Set<string>();
	/** propertyAlias -> variesByCulture, cached since property structure doesn't change mid-session. */
	#variesByCultureCache = new Map<string, boolean>();
	/** The blocking messages from this validator's most recent successful revalidate cycle. */
	#lastMessages: ValidationMessage[] = [];
	/**
	 * Set at the very start of `destroy()`. Several methods on this class are async and
	 * mutate shared validation state (the native validation context's messages, this
	 * instance's own watcher controllers) after an `await` point — if this instance is torn
	 * down (document/workspace switch) while one of those is still in flight, the pending
	 * continuation must NOT go on to mutate anything once it resumes: nothing would ever
	 * clear a message it re-adds after this point, since its owning validator is already
	 * gone. Every such continuation checks this flag immediately after its `await` and
	 * bails out early if it's already `true`.
	 */
	#isDestroyed = false;
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
	 * class doc comment on #isPrimary).
	 *
	 * On ANY change (promotion or demotion), immediately re-applies this validator's own
	 * last-known message set (rather than waiting for its next revalidate cycle, which only
	 * happens on save/publish) — otherwise an invariant property's message/watcher would have
	 * no active owner at all from the moment of the change until the next save, leaving its
	 * badge unable to live-clear on edit in the meantime. #applyMessages is a full rebuild
	 * (see its own comments), so this is always safe and simply reflects the new #isPrimary
	 * value on the next add/watch decision.
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
			// Nothing required any more - remove everything we previously applied/watched.
			this.#clearAllOwnedAndWatched();
			return;
		}

		// Resolve each message's target aliases once and reuse across every pass below,
		// instead of recomputing `#targetAliases(msg)` (a Set + filter allocation) on every
		// iteration of three separate loops over the same message array.
		const messageTargets = messages.map((msg) => ({ msg, targets: this.#targetAliases(msg) }));

		// Resolve the path + variesByCulture for every distinct property alias concurrently,
		// instead of awaiting them one at a time — property-structure lookups are independent
		// of one another. A message may target more than one alias (its own propertyAlias PLUS
		// any related aliases), so collect the full flattened set across all messages first.
		const aliases = [...new Set(messageTargets.flatMap((mt) => mt.targets))];
		const resolved = await Promise.all(aliases.map((alias) => this.#resolveAlias(alias)));
		const resolvedByAlias = new Map(aliases.map((alias, i) => [alias, resolved[i]]));

		// Bail out if this validator was torn down while the alias/path lookups above were in
		// flight — nothing below this point should add messages or watchers back for an
		// instance that's already gone; there would be no live validator left to ever clear
		// them again.
		if (this.#isDestroyed) return;

		// Which aliases this validator instance will actually manage (i.e. add a message for
		// and own the path/lifecycle of) - survives the invariant/primary-only filter below.
		// Only the primary validator manages INVARIANT properties — every variant would
		// otherwise resolve the same property to the identical path and race to
		// add/remove/watch it independently (see class doc comment on #isPrimary).
		const managedAliasSet = new Set<string>();
		for (const { targets } of messageTargets) {
			for (const alias of targets) {
				const info = resolvedByAlias.get(alias);
				if (!info) continue;
				if (!info.variesByCulture && !this.#isPrimary) continue;
				managedAliasSet.add(alias);
			}
		}

		// Build the full set of native messages REQUIRED after this cycle, keyed by a
		// STABLE identity (alias + severity + body — see `#messageKey`), instead of the
		// native manager's own auto-generated random key. This is the key fix (see plan.md,
		// Phase 11): Umbraco's `UmbContentValidationToHintsManager` tracks which messages it
		// has already converted to hints via a `#hintedMsgs` Set keyed by `message.key`, and
		// independently, asynchronously (one microtask per message) removes+re-adds a hint
		// whenever a message's key disappears and reappears. Previously we unconditionally
		// cleared EVERY message and re-added it with a brand new random key on every single
		// revalidate cycle (including ones - like Save & Publish - where nothing actually
		// changed), forcing Umbraco to tear down and rebuild every hint on every save, which
		// is what was overflowing the call stack via its own parent/child hint-controller
		// propagation in split view. By keeping the same key for a message that hasn't
		// changed, and only removing/adding the genuine delta below, an unchanged message
		// never disappears from the native messages array at all - so Umbraco's own
		// `#hintedMsgs.has(message.key)` check short-circuits and no hint work happens for it.
		const required = new Map<string, { alias: string; path: string; body: string }>();
		for (const { msg, targets } of messageTargets) {
			for (const alias of targets) {
				const info = resolvedByAlias.get(alias);
				if (!info || !managedAliasSet.has(alias)) continue;
				const key = this.#messageKey(alias, msg);
				required.set(key, { alias, path: info.path, body: msg.message });
			}
		}

		// Watchers are cheap Observable subscriptions (not native validation messages/hints),
		// so they're still torn down and rebuilt in full every cycle - this isn't part of the
		// hint-churn problem the diffing below addresses.
		for (const alias of this.#watchedAliases) {
			this.removeUmbControllerByAlias(this.#watcherAlias(alias));
		}
		this.#watchedAliases.clear();

		// Remove only messages that are no longer required (the actual delta) instead of
		// clearing everything unconditionally.
		const staleKeys = [...this.#appliedKeys.keys()].filter((key) => !required.has(key));
		if (staleKeys.length > 0) {
			const stalePaths = new Set(staleKeys.map((key) => this.#appliedKeys.get(key)!));
			this.#validationContext.messages.removeMessageByKeys(staleKeys);
			for (const key of staleKeys) {
				this.#appliedKeys.delete(key);
			}
			// A path may still be required by a DIFFERENT (still-required) message at the
			// same path - only clear its stale `client` mirror once genuinely nothing
			// remains there.
			for (const path of stalePaths) {
				this.#clearStaleClientMirrorIfPathEmpty(path);
			}
		}

		// Add (or, for anything unchanged, safely no-op re-add) every currently-required
		// message. Umbraco's own addMessage() already skips genuinely unchanged
		// (type, path, body) triples - so as long as we don't remove them first (see above),
		// this only ever performs real native work for messages that are actually new this
		// cycle. Still batched into a single notify cycle for whatever delta does apply.
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

		// For every alias that appears as a target of a message THIS instance owns at least
		// one sibling of, work out which of ITS OWN owned paths should be cleared when that
		// alias's value changes - "watchAliasToOwnedSiblings". Crucially, the watched alias
		// itself does not have to be owned/managed by this instance: e.g. a related INVARIANT
		// alias (owned only by the primary validator) still needs to be *observed* (read-only)
		// by every OTHER (non-primary) validator that owns the culture-varying primary alias
		// of the same message, purely so that fixing the shared invariant field also clears
		// every culture's own copy of the co-badge - not just the primary culture's copy.
		// Observing a value is read-only (no addMessage/removeMessagesByTypeAndPath call), so
		// this never re-introduces the multi-writer race that #isPrimary guards against.
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
			// The property structure isn't resolvable yet (e.g. content-type structure still
			// loading on the very first revalidate cycle right after opening the document) -
			// do NOT cache this. Caching a guess here would make a wrong guess permanent for
			// the lifetime of this validator instance: guessing "varies by culture" for an
			// actually-invariant property makes its live-edit watcher use this validator's own
			// culture as the variant filter, which never matches the property's real
			// culture:null value entry, so the badge could never clear on edit. Returning the
			// (uncached) fallback here lets the next revalidate cycle (save/publish, or a
			// later property-structure emission) resolve the real value and self-correct.
			return true;
		}

		const variesByCulture = propType.variesByCulture ?? false;
		this.#variesByCultureCache.set(propertyAlias, variesByCulture);
		return variesByCulture;
	}

	/**
	 * Observes a single property's value (scoped to this validator's own variantId — or, for
	 * INVARIANT properties, no variant filter at all, since Umbraco's own property-value
	 * lookup does an exact culture+segment match and an invariant property only ever has one
	 * value entry with culture:null/segment:null; passing this validator's own culture would
	 * never match it, so the watcher would never fire). The first emission is always the
	 * current value on subscribe, so it is skipped — only a genuine subsequent edit triggers
	 * a clear.
	 *
	 * `watchAlias` is the alias whose VALUE is being observed — it does not have to be an
	 * alias this validator owns a message for (see #applyMessages: a validator may watch a
	 * related alias purely to know when to clear its own owned aliases, e.g. a non-primary
	 * validator watching a related INVARIANT alias it doesn't itself own). On a genuine
	 * change, clears the message + ownership bookkeeping for every alias in
	 * `ownedAliasesToClear` that this validator still owns (skipping any already cleared),
	 * then stops watching `watchAlias` itself (its job is done for this message cycle — a
	 * fresh watcher is set up on the next #applyMessages cycle if still relevant).
	 */
	async #watchPropertyForClear(watchAlias: string, variesByCulture: boolean, ownedAliasesToClear: Set<string>) {
		if (!this.#contentWorkspace) return;

		const watchVariantId = variesByCulture ? this.#variantId : undefined;
		const obs = await this.#contentWorkspace.propertyValueByAlias(watchAlias, watchVariantId);
		if (!obs) return;

		// Bail out if this validator was torn down while the observable lookup above was in
		// flight — subscribing now would leak a watcher for an instance that's already gone
		// and that nothing will ever clean up via the normal #applyMessages/destroy paths.
		if (this.#isDestroyed) return;

		let isFirstEmission = true;
		this.observe(
			obs,
			() => {
				if (isFirstEmission) {
					isFirstEmission = false;
					return;
				}

				// The value changed — clear every owned alias associated with this watched
				// alias (see #applyMessages), since they all represent the same underlying
				// validation concern. Batched into a single native notify cycle (Phase 10 fix
				// in plan.md) since a related-property message can clear several sibling
				// aliases at once here.
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

				// This watcher's own job is done - stop watching this specific alias's value.
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
		// Remove any owned messages, plus every active watcher (owned or watch-only) this
		// validator set up, before it is torn down (variant removed / doc switched). Watcher
		// controllers are also cleaned up automatically by the framework on host disconnect,
		// but we remove them explicitly for clarity.
		this.#clearAllOwnedAndWatched();
		this.#validationContext = undefined;
		this.#contentWorkspace = undefined;
		this.#actionEventContext = undefined;
		super.destroy();
	}

	/**
	 * Removes every message and watcher this validator instance currently owns (both
	 * "owning" watchers and read-only "watch-only" watchers — see `#watchedAliases`), then
	 * resets the bookkeeping maps. Shared by `#applyMessages` (full refresh, before
	 * re-applying the new message set) and `destroy()` (final teardown) — both need
	 * identical cleanup, just at different points in the lifecycle. Batched into a single
	 * native notify cycle (see the Phase 10 stack-overflow fix in plan.md) rather than one
	 * per removed path/watcher, for the same reason as `#applyMessages`'s add loop.
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
	 * Removes our own `customValidator` message at `path`, then — if no other message (of
	 * ANY type besides Umbraco's own `client` type) remains at that exact path — also
	 * removes any lingering `client`-type message at the same path.
	 *
	 * This directly compensates for a gap in Umbraco's own `UmbFormControlValidator`
	 * (`form-control-validator.controller.js`): it mirrors any non-`client` message at a
	 * property's data path into its OWN separate `client`-type message (via
	 * `UmbBindServerValidationToFormControl`'s reactive `addValidator`/`checkValidity` chain)
	 * so the native form control shows as invalid — but its `hostDisconnected()` explicitly
	 * skips removing that mirrored `client` message (the removal call is commented out in
	 * Umbraco's own source). If the property's DOM element is disconnected (switching
	 * workspace view/tab, or document) before that reactive chain has a chance to run
	 * (`observe` → `#demolish()` → `checkValidity()` → valid event → remove `client`
	 * message), the mirrored message is orphaned forever — it has no owner left to ever
	 * clear it, and it alone is enough to block Save/Publish even though our own
	 * authoritative `customValidator` message is already gone.
	 *
	 * We only remove the `client` mirror once we've confirmed no other (non-`client`)
	 * message still exists at this path — mirroring exactly the condition
	 * `UmbBindServerValidationToFormControl` itself uses to decide whether the control
	 * should be valid — so this never masks a genuine, still-outstanding native validation
	 * failure (e.g. a native "mandatory field" message) at the same path.
	 */
	#clearPathAndStaleClientMirror(path: string) {
		if (!this.#validationContext) return;

		this.#validationContext.messages.removeMessagesByTypeAndPath('customValidator', path);
		this.#forgetAppliedKeysAtPath(path);

		this.#clearStaleClientMirrorIfPathEmpty(path);
	}

	/**
	 * If no non-`client` message remains at `path`, removes any lingering `client`-type
	 * message there too (see the detailed comment on `#clearPathAndStaleClientMirror` for
	 * why this mirror can be orphaned). Split out as its own step so `#applyMessages`'s
	 * key-based diff can remove stale `customValidator` messages in one batched
	 * `removeMessageByKeys` call and only THEN check, per affected path, whether the
	 * `client` mirror is now also safe to remove — without redundantly attempting to
	 * remove the (already-gone) `customValidator` message a second time.
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
