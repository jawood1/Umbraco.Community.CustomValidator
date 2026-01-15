import { nothing as v, html as n, repeat as q, state as f, customElement as j } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as tt } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as it } from "@umbraco-cms/backoffice/style";
import { UMB_CONTENT_WORKSPACE_CONTEXT as et } from "@umbraco-cms/backoffice/content";
import { UMB_NOTIFICATION_CONTEXT as at } from "@umbraco-cms/backoffice/notification";
import { VALIDATION_WORKSPACE_CONTEXT as g } from "./validation-workspace-context-JF3_5EKq.js";
var st = Object.defineProperty, nt = Object.getOwnPropertyDescriptor, M = (t) => {
  throw TypeError(t);
}, d = (t, i, s, r) => {
  for (var l = r > 1 ? void 0 : r ? nt(i, s) : i, y = t.length - 1, C; y >= 0; y--)
    (C = t[y]) && (l = (r ? C(i, s, l) : C(l)) || l);
  return r && l && st(i, s, l), l;
}, I = (t, i, s) => i.has(t) || M("Cannot " + s), o = (t, i, s) => (I(t, i, "read from private field"), i.get(t)), h = (t, i, s) => i.has(t) ? M("Cannot add the same private member more than once") : i instanceof WeakSet ? i.add(t) : i.set(t, s), R = (t, i, s, r) => (I(t, i, "write to private field"), i.set(t, s), s), a = (t, i, s) => (I(t, i, "access private method"), s), m, u, p, e, O, T, $, A, D, W, N, P, _, E, x, L, U, F, V, Y, b, B, X, z, H, K, G, J, Q, Z;
const rt = 500, ot = 1e3, lt = 2e3, k = {
  Error: 0,
  Warning: 1,
  Info: 2
}, ut = {
  Error: "danger",
  Warning: "warning",
  Info: "default"
}, S = /* @__PURE__ */ new Map();
let w = 0, c = class extends tt {
  constructor() {
    super(), h(this, e), h(this, m), this._isValidating = !1, h(this, u), h(this, p), h(this, E, async () => {
      await a(this, e, _).call(this);
    }), h(this, x, async () => {
      if (this._documentId && this._validationResult?.hasValidator !== !1)
        try {
          if (await a(this, e, _).call(this), (await this.getContext(g))?.hasBlockingErrors(this._currentCulture)) {
            await a(this, e, V).call(this, "danger", "Cannot Publish", "Validation errors must be resolved first");
            return;
          }
          await a(this, e, Y).call(this);
        } catch (t) {
          await a(this, e, V).call(this, "danger", "Error", t instanceof Error ? t.message : "Save and publish failed");
        }
    }), R(this, m, w++), setTimeout(() => {
      w > 1 && (w = 0);
    }, lt), a(this, e, O).call(this), a(this, e, P).call(this);
  }
  willUpdate(t) {
    super.willUpdate(t), t.has("_validationResult") && (this._sortedMessages = a(this, e, L).call(this), this._messageCounts = a(this, e, U).call(this));
  }
  connectedCallback() {
    super.connectedCallback();
    const t = this._documentId ? S.get(this._documentId) ?? !1 : !1;
    this._documentId && (t ? a(this, e, _).call(this, { skipSave: !0 }) : (S.set(this._documentId, !0), a(this, e, _).call(this, { useDelay: !0, skipSave: !0 })));
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._sortedMessages = void 0, this._messageCounts = void 0;
  }
  render() {
    const t = this._validationResult?.hasValidator !== !1 && this._validationResult !== void 0;
    return n`
            <umb-body-layout header-transparent header-fit-height>
                <div style="display: flex; flex-direction: column; gap: var(--uui-size-layout-1);">
                    ${t ? n`
                        <uui-box headline-variant="h4">
                            ${a(this, e, J).call(this)}
                            ${a(this, e, Z).call(this)}
                        </uui-box>
                    ` : v}

                    ${a(this, e, X).call(this)}
                </div>
            </umb-body-layout>
        `;
  }
};
m = /* @__PURE__ */ new WeakMap();
u = /* @__PURE__ */ new WeakMap();
p = /* @__PURE__ */ new WeakMap();
e = /* @__PURE__ */ new WeakSet();
O = function() {
  this.consumeContext(et, (t) => {
    t && (R(this, u, t), a(this, e, T).call(this, t), a(this, e, A).call(this, t));
  });
};
T = function(t) {
  this.observe(
    t.splitView.activeVariantsInfo,
    async (i) => {
      if (i && i.length > 0) {
        const s = a(this, e, $).call(this, i.length), l = i[s]?.culture ?? void 0;
        this._currentCulture !== l && (this._currentCulture = l, await a(this, e, N).call(this));
      } else
        this._currentCulture = void 0;
    }
  );
};
$ = function(t) {
  return t > 1 ? Math.min(o(this, m), t - 1) : 0;
};
A = function(t) {
  this.observe(
    t.unique,
    async (i) => {
      const s = a(this, e, D).call(this, i);
      this._documentId = i ?? void 0, R(this, p, i ?? void 0), await a(this, e, W).call(this), s && i && S.delete(i);
    }
  );
};
D = function(t) {
  return o(this, p) !== void 0 && o(this, p) !== t;
};
W = async function() {
  try {
    const t = await this.getContext(g);
    t && t.clearValidation();
  } catch (t) {
    console.error("Failed to clear validation on document switch:", t);
  }
};
N = async function() {
  try {
    const t = await this.getContext(g);
    t && (this._validationResult = t.getValidationResult(this._currentCulture));
  } catch (t) {
    console.error("Failed to load cached validation result:", t);
  }
};
P = function() {
  this.consumeContext(g, (t) => {
    t && this.observe(
      t.isValidating,
      (i) => {
        this._isValidating = i;
      }
    );
  });
};
_ = async function(t = {}) {
  if (this._documentId && this._validationResult?.hasValidator !== !1)
    try {
      const i = await this.getContext(g);
      if (!i) return;
      const s = async () => {
        try {
          !t.skipSave && o(this, u)?.requestSubmit && (await o(this, u).requestSubmit(), await a(this, e, b).call(this, rt)), await i.validateManually(this._documentId, this._currentCulture), this._validationResult = i.getValidationResult(this._currentCulture);
        } catch (r) {
          console.debug("Validation skipped:", r);
        }
      };
      t.useDelay && await a(this, e, b).call(this, ot), await s();
    } catch (i) {
      console.error("Failed to validate and update result:", i);
    }
};
E = /* @__PURE__ */ new WeakMap();
x = /* @__PURE__ */ new WeakMap();
L = function() {
  if (this._validationResult?.messages)
    return [...this._validationResult.messages].sort(
      (t, i) => k[t.severity] - k[i.severity]
    );
};
U = function() {
  return this._validationResult ? {
    errors: this._validationResult.messages.filter((t) => t.severity === "Error").length,
    warnings: this._validationResult.messages.filter((t) => t.severity === "Warning").length
  } : { errors: 0, warnings: 0 };
};
F = function() {
  return this._validationResult?.messages.some(
    (t) => t.severity === "Error" || t.severity === "Warning"
  ) ?? !1;
};
V = async function(t, i, s) {
  try {
    (await this.getContext(at))?.peek(t, {
      data: { headline: i, message: s }
    });
  } catch (r) {
    console.error("Failed to show notification:", r);
  }
};
Y = async function() {
  try {
    o(this, u) && "publish" in o(this, u) && typeof o(this, u).publish == "function" && await o(this, u).publish();
  } catch (t) {
    throw console.error("Failed to publish document:", t), t;
  }
};
b = function(t) {
  return new Promise((i) => setTimeout(i, t));
};
B = function(t) {
  return ut[t];
};
X = function() {
  return this._isValidating || !this._validationResult ? a(this, e, z).call(this) : this._validationResult.hasValidator ? n`
            <uui-box headline="Validation Results" headline-variant="h5">
                ${a(this, e, F).call(this) ? v : a(this, e, K).call(this)}
                <div>
                    ${q(
    this._sortedMessages ?? [],
    (t) => t.message,
    (t) => a(this, e, G).call(this, t)
  )}
                </div>
            </uui-box>
        ` : a(this, e, H).call(this);
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
K = function() {
  return n`
            <p style="color: var(--uui-color-positive);">
                <uui-icon name="icon-check"></uui-icon>
                All validations passed successfully.
            </p>
        `;
};
G = function(t) {
  const i = a(this, e, B).call(this, t.severity);
  return n`
            <p>
                <uui-tag color=${i} look="primary">
                    ${t.severity}
                </uui-tag>
                ${t.message}
            </p>
        `;
};
J = function() {
  const { errors: t, warnings: i } = this._messageCounts ?? { errors: 0, warnings: 0 };
  return n`
            <div slot="headline">
                ${a(this, e, Q).call(this, t)}
                Document Validation
            </div>
            <div slot="header-actions">
                ${t > 0 ? n`
                    <uui-tag color="danger" look="primary">${t}</uui-tag>
                ` : v}
                ${i > 0 ? n`
                    <uui-tag color="warning" look="primary">${i}</uui-tag>
                ` : v}
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
                    @click=${o(this, E)}
                    ?disabled=${!this._documentId || this._isValidating}>
                    Save & Validate
                </uui-button>
                <uui-button
                    look="primary"
                    color="positive"
                    label="Validate & Publish"
                    @click=${o(this, x)}
                    ?disabled=${!this._documentId || this._isValidating}>
                    Validate & Publish
                </uui-button>
                ${this._isValidating ? n`<uui-loader></uui-loader>` : v}
            </uui-button-group>
        `;
};
c.styles = [it];
d([
  f()
], c.prototype, "_documentId", 2);
d([
  f()
], c.prototype, "_validationResult", 2);
d([
  f()
], c.prototype, "_isValidating", 2);
d([
  f()
], c.prototype, "_currentCulture", 2);
d([
  f()
], c.prototype, "_sortedMessages", 2);
d([
  f()
], c.prototype, "_messageCounts", 2);
c = d([
  j("custom-validator-workspace-view")
], c);
export {
  c as CustomValidatorWorkspaceView,
  c as element
};
//# sourceMappingURL=validation-view.element-BRwg5kqR.js.map
