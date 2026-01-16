import { nothing as y, html as n, repeat as q, state as f, customElement as j } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as tt } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as et } from "@umbraco-cms/backoffice/style";
import { UMB_CONTENT_WORKSPACE_CONTEXT as it } from "@umbraco-cms/backoffice/content";
import { UMB_NOTIFICATION_CONTEXT as at } from "@umbraco-cms/backoffice/notification";
import { V as m, a as u } from "./validation-workspace-context-BTUL9Nvg.js";
var st = Object.defineProperty, nt = Object.getOwnPropertyDescriptor, M = (t) => {
  throw TypeError(t);
}, h = (t, e, s, r) => {
  for (var o = r > 1 ? void 0 : r ? nt(e, s) : e, _ = t.length - 1, w; _ >= 0; _--)
    (w = t[_]) && (o = (r ? w(e, s, o) : w(o)) || o);
  return r && o && st(e, s, o), o;
}, S = (t, e, s) => e.has(t) || M("Cannot " + s), l = (t, e, s) => (S(t, e, "read from private field"), s ? s.call(t) : e.get(t)), v = (t, e, s) => e.has(t) ? M("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, s), I = (t, e, s, r) => (S(t, e, "write to private field"), e.set(t, s), s), a = (t, e, s) => (S(t, e, "access private method"), s), V, d, g, i, $, T, D, W, A, N, P, L, p, k, E, U, F, B, R, K, x, Y, X, z, H, G, J, Q, Z;
const rt = 500, ot = 1e3, O = {
  [u.Error]: 0,
  [u.Warning]: 1,
  [u.Info]: 2
}, lt = {
  [u.Error]: "danger",
  [u.Warning]: "warning",
  [u.Info]: "default"
}, C = /* @__PURE__ */ new Map(), b = [];
let ut = 0, c = class extends tt {
  constructor() {
    super(), v(this, i), v(this, V), this._isValidating = !1, this._cultureReady = !1, v(this, d), v(this, g), v(this, k, async () => {
      await a(this, i, p).call(this);
    }), v(this, E, async () => {
      if (this._documentId && this._validationResult?.hasValidator !== !1)
        try {
          if (await a(this, i, p).call(this), (await this.getContext(m))?.hasBlockingErrors(this._currentCulture)) {
            await a(this, i, R).call(this, "danger", "Cannot Publish", "Validation errors must be resolved first");
            return;
          }
          await a(this, i, K).call(this);
        } catch (t) {
          await a(this, i, R).call(this, "danger", "Error", t instanceof Error ? t.message : "Save and publish failed");
        }
    }), I(this, V, ut++), b.push(this), a(this, i, $).call(this), a(this, i, L).call(this);
  }
  willUpdate(t) {
    super.willUpdate(t), t.has("_validationResult") && (this._sortedMessages = a(this, i, U).call(this), this._messageCounts = a(this, i, F).call(this));
  }
  connectedCallback() {
    if (super.connectedCallback(), !this._cultureReady)
      return;
    const t = a(this, i, D).call(this), e = t ? C.get(t) ?? !1 : !1;
    this._documentId && (e ? a(this, i, p).call(this, { skipSave: !0 }) : (t && C.set(t, !0), a(this, i, p).call(this, { useDelay: !0, skipSave: !0 })));
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._sortedMessages = void 0, this._messageCounts = void 0;
    const t = b.indexOf(this);
    t !== -1 && b.splice(t, 1);
  }
  render() {
    const t = this._validationResult?.hasValidator !== !1 && this._validationResult !== void 0;
    return n`
            <umb-body-layout header-transparent header-fit-height>
                <div style="display: flex; flex-direction: column; gap: var(--uui-size-layout-1);">
                    ${t ? n`
                        <uui-box headline-variant="h4">
                            ${a(this, i, J).call(this)}
                            ${a(this, i, Z).call(this)}
                        </uui-box>
                    ` : y}

                    ${a(this, i, X).call(this)}
                </div>
            </umb-body-layout>
        `;
  }
};
V = /* @__PURE__ */ new WeakMap();
d = /* @__PURE__ */ new WeakMap();
g = /* @__PURE__ */ new WeakMap();
i = /* @__PURE__ */ new WeakSet();
$ = function() {
  this.consumeContext(it, (t) => {
    t && (I(this, d, t), a(this, i, T).call(this, t), a(this, i, W).call(this, t));
  });
};
T = function(t) {
  this.observe(
    t.splitView.activeVariantsInfo,
    async (e) => {
      if (!e || e.length === 0) {
        this._currentCulture = void 0, this._cultureReady = !0;
        return;
      }
      let s = b.indexOf(this);
      const r = Math.max(0, Math.min(s, e.length - 1)), _ = e[r]?.culture ?? void 0;
      this._currentCulture !== _ ? (this._currentCulture = _, this._cultureReady = !0, await a(this, i, P).call(this)) : this._cultureReady || (this._cultureReady = !0);
    }
  );
};
D = function() {
  if (this._documentId)
    return `${this._documentId}|${this._currentCulture ?? "undefined"}`;
};
W = function(t) {
  this.observe(
    t.unique,
    async (e) => {
      const s = a(this, i, A).call(this, e);
      this._documentId = e ?? void 0, I(this, g, e ?? void 0), await a(this, i, N).call(this), s && e && Array.from(C.keys()).filter((o) => o.startsWith(`${e}|`)).forEach((o) => C.delete(o));
    }
  );
};
A = function(t) {
  return l(this, g) !== void 0 && l(this, g) !== t;
};
N = async function() {
  try {
    const t = await this.getContext(m);
    t && t.clearValidation();
  } catch (t) {
    console.error("Failed to clear validation on document switch:", t);
  }
};
P = async function() {
  try {
    const t = await this.getContext(m);
    t && (this._validationResult = t.getValidationResult(this._currentCulture));
  } catch (t) {
    console.error("Failed to load cached validation result:", t);
  }
};
L = function() {
  this.consumeContext(m, (t) => {
    t && this.observe(
      t.isValidating,
      (e) => {
        this._isValidating = e;
      }
    );
  });
};
p = async function(t = {}) {
  if (this._documentId && this._validationResult?.hasValidator !== !1)
    try {
      const e = await this.getContext(m);
      if (!e) return;
      const s = async () => {
        try {
          !t.skipSave && l(this, d)?.requestSubmit && (await l(this, d).requestSubmit(), await a(this, i, x).call(this, rt)), await e.validateManually(this._documentId, this._currentCulture), this._validationResult = e.getValidationResult(this._currentCulture);
        } catch (r) {
          console.debug("Validation skipped:", r);
        }
      };
      t.useDelay && await a(this, i, x).call(this, ot), await s();
    } catch (e) {
      console.error("Failed to validate and update result:", e);
    }
};
k = /* @__PURE__ */ new WeakMap();
E = /* @__PURE__ */ new WeakMap();
U = function() {
  if (this._validationResult?.messages)
    return [...this._validationResult.messages].sort(
      (t, e) => O[t.severity] - O[e.severity]
    );
};
F = function() {
  return this._validationResult ? {
    errors: this._validationResult.messages.filter((t) => t.severity === u.Error).length,
    warnings: this._validationResult.messages.filter((t) => t.severity === u.Warning).length
  } : { errors: 0, warnings: 0 };
};
B = function() {
  return this._validationResult?.messages.some(
    (t) => t.severity === u.Error || t.severity === u.Warning
  ) ?? !1;
};
R = async function(t, e, s) {
  try {
    (await this.getContext(at))?.peek(t, {
      data: { headline: e, message: s }
    });
  } catch (r) {
    console.error("Failed to show notification:", r);
  }
};
K = async function() {
  try {
    l(this, d) && "publish" in l(this, d) && typeof l(this, d).publish == "function" && await l(this, d).publish();
  } catch (t) {
    throw console.error("Failed to publish document:", t), t;
  }
};
x = function(t) {
  return new Promise((e) => setTimeout(e, t));
};
Y = function(t) {
  return lt[t];
};
X = function() {
  return this._isValidating || !this._validationResult ? a(this, i, z).call(this) : this._validationResult.hasValidator ? n`
            <uui-box headline="Validation Results" headline-variant="h5">
                ${a(this, i, B).call(this) ? y : a(this, i, G).call(this)}
                <uui-table aria-label="Validation Messages">
                    <uui-table-head>
                        <uui-table-head-cell style="width: 120px;">Severity</uui-table-head-cell>
                        <uui-table-head-cell>Message</uui-table-head-cell>
                    </uui-table-head>
                    ${q(
    this._sortedMessages ?? [],
    (t) => t.message,
    (t) => n`
                            <uui-table-row>
                                <uui-table-cell>
                                    <uui-tag color=${a(this, i, Y).call(this, t.severity)} look="primary">
                                        ${t.severity}
                                    </uui-tag>
                                </uui-table-cell>
                                <uui-table-cell>${t.message}</uui-table-cell>
                            </uui-table-row>
                        `
  )}
                </uui-table>
            </uui-box>
        ` : a(this, i, H).call(this);
};
z = function() {
  return n`
            <uui-box headline="Status" headline-variant="h5">
                <div style="display: flex; align-items: center; gap: var(--uui-size-space-3);">
                    <uui-loader></uui-loader>
                    <span>Validating...</span>
                </div>
            </uui-box>
        `;
};
H = function() {
  return n`
            <uui-box headline="Status" headline-variant="h5">
                <p>No validation configured for this content type (${this._validationResult?.contentTypeAlias}).</p>
            </uui-box>
        `;
};
G = function() {
  return n`
            <p style="color: var(--uui-color-positive);">
                <uui-icon name="icon-check"></uui-icon>
                All validations passed successfully.
            </p>
        `;
};
J = function() {
  const { errors: t, warnings: e } = this._messageCounts ?? { errors: 0, warnings: 0 };
  return n`
            <div slot="headline">
                ${a(this, i, Q).call(this, t)}
                Document Validation
            </div>
            <div slot="header-actions">
                ${t > 0 ? n`
                    <uui-tag color="danger" look="primary">${t}</uui-tag>
                ` : y}
                ${e > 0 ? n`
                    <uui-tag color="warning" look="primary">${e}</uui-tag>
                ` : y}
            </div>
        `;
};
Q = function(t) {
  return t > 0 ? n`<uui-icon name="icon-delete" style="color: var(--uui-color-danger);"></uui-icon>` : n`<uui-icon name="icon-check" style="color: var(--uui-color-positive);"></uui-icon>`;
};
Z = function() {
  return n`
            <uui-button-group>
                <uui-button
                    look="primary"
                    color="default"
                    label="Save & Validate"
                    @click=${l(this, k)}
                    ?disabled=${!this._documentId || this._isValidating}>
                    Save & Validate
                </uui-button>
                <uui-button
                    look="primary"
                    color="positive"
                    label="Validate & Publish"
                    @click=${l(this, E)}
                    ?disabled=${!this._documentId || this._isValidating}>
                    Validate & Publish
                </uui-button>
                ${this._isValidating ? n`<uui-loader></uui-loader>` : y}
            </uui-button-group>
        `;
};
c.styles = [et];
h([
  f()
], c.prototype, "_documentId", 2);
h([
  f()
], c.prototype, "_validationResult", 2);
h([
  f()
], c.prototype, "_isValidating", 2);
h([
  f()
], c.prototype, "_currentCulture", 2);
h([
  f()
], c.prototype, "_cultureReady", 2);
h([
  f()
], c.prototype, "_sortedMessages", 2);
h([
  f()
], c.prototype, "_messageCounts", 2);
c = h([
  j("custom-validator-workspace-view")
], c);
export {
  c as CustomValidatorWorkspaceView,
  c as element
};
//# sourceMappingURL=validation-view.element-B03vqM15.js.map
