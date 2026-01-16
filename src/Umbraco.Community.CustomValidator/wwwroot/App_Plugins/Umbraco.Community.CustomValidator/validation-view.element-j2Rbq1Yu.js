import { nothing as C, html as l, repeat as tt, state as v, customElement as et } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as it } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as at } from "@umbraco-cms/backoffice/style";
import { UMB_CONTENT_WORKSPACE_CONTEXT as st } from "@umbraco-cms/backoffice/content";
import { UMB_NOTIFICATION_CONTEXT as nt } from "@umbraco-cms/backoffice/notification";
import { V, a as u } from "./validation-workspace-context-BTUL9Nvg.js";
var rt = Object.defineProperty, ot = Object.getOwnPropertyDescriptor, O = (t) => {
  throw TypeError(t);
}, h = (t, e, s, n) => {
  for (var r = n > 1 ? void 0 : n ? ot(e, s) : e, f = t.length - 1, p; f >= 0; f--)
    (p = t[f]) && (r = (n ? p(e, s, r) : p(r)) || r);
  return n && r && rt(e, s, r), r;
}, k = (t, e, s) => e.has(t) || O("Cannot " + s), o = (t, e, s) => (k(t, e, "read from private field"), s ? s.call(t) : e.get(t)), y = (t, e, s) => e.has(t) ? O("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, s), x = (t, e, s, n) => (k(t, e, "write to private field"), e.set(t, s), s), a = (t, e, s) => (k(t, e, "access private method"), s), _, d, w, i, T, D, W, A, N, P, R, L, g, E, M, U, F, z, I, B, S, K, Y, X, H, G, J, Q, Z, q;
const lt = 500, ut = 1e3, $ = {
  [u.Error]: 0,
  [u.Warning]: 1,
  [u.Info]: 2
}, ct = {
  [u.Error]: "danger",
  [u.Warning]: "warning",
  [u.Info]: "default"
}, b = /* @__PURE__ */ new Map(), m = /* @__PURE__ */ new Map();
let dt = 0, c = class extends it {
  constructor() {
    super(), y(this, i), y(this, _), this._isValidating = !1, this._cultureReady = !1, y(this, d), y(this, w), y(this, E, async () => {
      await a(this, i, g).call(this);
    }), y(this, M, async () => {
      if (this._documentId && this._validationResult?.hasValidator !== !1)
        try {
          if (await a(this, i, g).call(this), (await this.getContext(V))?.hasBlockingErrors(this._currentCulture)) {
            await a(this, i, I).call(this, "danger", "Cannot Publish", "Validation errors must be resolved first");
            return;
          }
          await a(this, i, B).call(this);
        } catch (t) {
          await a(this, i, I).call(this, "danger", "Error", t instanceof Error ? t.message : "Save and publish failed");
        }
    }), x(this, _, dt++), a(this, i, T).call(this), a(this, i, L).call(this);
  }
  willUpdate(t) {
    super.willUpdate(t), t.has("_validationResult") && (this._sortedMessages = a(this, i, U).call(this), this._messageCounts = a(this, i, F).call(this));
  }
  connectedCallback() {
    if (super.connectedCallback(), !this._cultureReady)
      return;
    const t = a(this, i, W).call(this), e = t ? b.get(t) ?? !1 : !1;
    this._documentId && (e ? a(this, i, g).call(this, { skipSave: !0 }) : (t && b.set(t, !0), a(this, i, g).call(this, { useDelay: !0, skipSave: !0 })));
  }
  disconnectedCallback() {
    if (super.disconnectedCallback(), this._sortedMessages = void 0, this._messageCounts = void 0, this._documentId) {
      const t = m.get(this._documentId);
      t && (t.delete(o(this, _)), t.size === 0 && m.delete(this._documentId));
    }
  }
  render() {
    const t = this._validationResult?.hasValidator !== !1 && this._validationResult !== void 0;
    return l`
            <umb-body-layout header-transparent header-fit-height>
                <div style="display: flex; flex-direction: column; gap: var(--uui-size-layout-1);">
                    ${t ? l`
                        <uui-box headline-variant="h4">
                            ${a(this, i, Q).call(this)}
                            ${a(this, i, q).call(this)}
                        </uui-box>
                    ` : C}

                    ${a(this, i, Y).call(this)}
                </div>
            </umb-body-layout>
        `;
  }
};
_ = /* @__PURE__ */ new WeakMap();
d = /* @__PURE__ */ new WeakMap();
w = /* @__PURE__ */ new WeakMap();
i = /* @__PURE__ */ new WeakSet();
T = function() {
  this.consumeContext(st, (t) => {
    t && (x(this, d, t), a(this, i, D).call(this, t), a(this, i, A).call(this, t));
  });
};
D = function(t) {
  this.observe(
    t.splitView.activeVariantsInfo,
    async (e) => {
      if (!e || e.length === 0) {
        this._currentCulture = void 0, this._cultureReady = !0;
        return;
      }
      const s = this._documentId || "unknown";
      let n = m.get(s);
      if (e.length > 1) {
        if (n || (n = /* @__PURE__ */ new Map(), m.set(s, n)), !n.has(o(this, _))) {
          const j = n.size;
          n.set(o(this, _), j);
        }
        const r = n.get(o(this, _)), p = e[r]?.culture ?? void 0;
        this._currentCulture !== p ? (this._currentCulture = p, this._cultureReady = !0, await a(this, i, R).call(this)) : this._cultureReady || (this._cultureReady = !0);
      } else {
        n && m.delete(s);
        const f = e[0]?.culture ?? void 0;
        this._currentCulture !== f ? (this._currentCulture = f, this._cultureReady = !0, await a(this, i, R).call(this)) : this._cultureReady || (this._cultureReady = !0);
      }
    }
  );
};
W = function() {
  if (this._documentId)
    return `${this._documentId}|${this._currentCulture ?? "undefined"}`;
};
A = function(t) {
  this.observe(
    t.unique,
    async (e) => {
      const s = a(this, i, N).call(this, e);
      this._documentId = e ?? void 0, x(this, w, e ?? void 0), await a(this, i, P).call(this), s && e && Array.from(b.keys()).filter((r) => r.startsWith(`${e}|`)).forEach((r) => b.delete(r));
    }
  );
};
N = function(t) {
  return o(this, w) !== void 0 && o(this, w) !== t;
};
P = async function() {
  try {
    const t = await this.getContext(V);
    t && t.clearValidation();
  } catch (t) {
    console.error("Failed to clear validation on document switch:", t);
  }
};
R = async function() {
  try {
    const t = await this.getContext(V);
    t && (this._validationResult = t.getValidationResult(this._currentCulture));
  } catch (t) {
    console.error("Failed to load cached validation result:", t);
  }
};
L = function() {
  this.consumeContext(V, (t) => {
    t && this.observe(
      t.isValidating,
      (e) => {
        this._isValidating = e;
      }
    );
  });
};
g = async function(t = {}) {
  if (this._documentId && this._validationResult?.hasValidator !== !1)
    try {
      const e = await this.getContext(V);
      if (!e) return;
      const s = async () => {
        try {
          !t.skipSave && o(this, d)?.requestSubmit && (await o(this, d).requestSubmit(), await a(this, i, S).call(this, lt)), await e.validateManually(this._documentId, this._currentCulture), this._validationResult = e.getValidationResult(this._currentCulture);
        } catch (n) {
          console.debug("Validation skipped:", n);
        }
      };
      t.useDelay && await a(this, i, S).call(this, ut), await s();
    } catch (e) {
      console.error("Failed to validate and update result:", e);
    }
};
E = /* @__PURE__ */ new WeakMap();
M = /* @__PURE__ */ new WeakMap();
U = function() {
  if (this._validationResult?.messages)
    return [...this._validationResult.messages].sort(
      (t, e) => $[t.severity] - $[e.severity]
    );
};
F = function() {
  return this._validationResult ? {
    errors: this._validationResult.messages.filter((t) => t.severity === u.Error).length,
    warnings: this._validationResult.messages.filter((t) => t.severity === u.Warning).length
  } : { errors: 0, warnings: 0 };
};
z = function() {
  return this._validationResult?.messages.some(
    (t) => t.severity === u.Error || t.severity === u.Warning
  ) ?? !1;
};
I = async function(t, e, s) {
  try {
    (await this.getContext(nt))?.peek(t, {
      data: { headline: e, message: s }
    });
  } catch (n) {
    console.error("Failed to show notification:", n);
  }
};
B = async function() {
  try {
    o(this, d) && "publish" in o(this, d) && typeof o(this, d).publish == "function" && await o(this, d).publish();
  } catch (t) {
    throw console.error("Failed to publish document:", t), t;
  }
};
S = function(t) {
  return new Promise((e) => setTimeout(e, t));
};
K = function(t) {
  return ct[t];
};
Y = function() {
  return this._isValidating || !this._validationResult ? a(this, i, X).call(this) : this._validationResult.hasValidator ? l`
            <uui-box headline="Validation Results" headline-variant="h5">
                ${a(this, i, z).call(this) ? C : a(this, i, G).call(this)}
                <div>
                    ${tt(
    this._sortedMessages ?? [],
    (t) => t.message,
    (t) => a(this, i, J).call(this, t)
  )}
                </div>
            </uui-box>
        ` : a(this, i, H).call(this);
};
X = function() {
  return l`
            <uui-box headline="Status" headline-variant="h5">
                <div style="display: flex; align-items: center; gap: var(--uui-size-space-3);">
                    <uui-loader></uui-loader>
                    <span>Validating...</span>
                </div>
            </uui-box>
        `;
};
H = function() {
  return l`
            <uui-box headline="Status" headline-variant="h5">
                <p>No validation configured for this content type (${this._validationResult?.contentTypeAlias}).</p>
            </uui-box>
        `;
};
G = function() {
  return l`
            <p style="color: var(--uui-color-positive);">
                <uui-icon name="icon-check"></uui-icon>
                All validations passed successfully.
            </p>
        `;
};
J = function(t) {
  const e = a(this, i, K).call(this, t.severity);
  return l`
            <p>
                <uui-tag color=${e} look="primary">
                    ${t.severity}
                </uui-tag>
                ${t.message}
            </p>
        `;
};
Q = function() {
  const { errors: t, warnings: e } = this._messageCounts ?? { errors: 0, warnings: 0 };
  return l`
            <div slot="headline">
                ${a(this, i, Z).call(this, t)}
                Document Validation
            </div>
            <div slot="header-actions">
                ${t > 0 ? l`
                    <uui-tag color="danger" look="primary">${t}</uui-tag>
                ` : C}
                ${e > 0 ? l`
                    <uui-tag color="warning" look="primary">${e}</uui-tag>
                ` : C}
            </div>
        `;
};
Z = function(t) {
  return t > 0 ? l`<uui-icon name="icon-delete" style="color: var(--uui-color-danger);"></uui-icon>` : l`<uui-icon name="icon-check" style="color: var(--uui-color-positive);"></uui-icon>`;
};
q = function() {
  return l`
            <uui-button-group>
                <uui-button
                    look="primary"
                    color="default"
                    label="Save & Validate"
                    @click=${o(this, E)}
                    ?disabled=${!this._documentId || this._isValidating}>
                    Save & Validate
                </uui-button>
                <uui-button
                    look="primary"
                    color="positive"
                    label="Validate & Publish"
                    @click=${o(this, M)}
                    ?disabled=${!this._documentId || this._isValidating}>
                    Validate & Publish
                </uui-button>
                ${this._isValidating ? l`<uui-loader></uui-loader>` : C}
            </uui-button-group>
        `;
};
c.styles = [at];
h([
  v()
], c.prototype, "_documentId", 2);
h([
  v()
], c.prototype, "_validationResult", 2);
h([
  v()
], c.prototype, "_isValidating", 2);
h([
  v()
], c.prototype, "_currentCulture", 2);
h([
  v()
], c.prototype, "_cultureReady", 2);
h([
  v()
], c.prototype, "_sortedMessages", 2);
h([
  v()
], c.prototype, "_messageCounts", 2);
c = h([
  et("custom-validator-workspace-view")
], c);
export {
  c as CustomValidatorWorkspaceView,
  c as element
};
//# sourceMappingURL=validation-view.element-j2Rbq1Yu.js.map
