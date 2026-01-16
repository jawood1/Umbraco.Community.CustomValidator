import { nothing as p, html as n, repeat as j, state as _, customElement as tt } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as it } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as et } from "@umbraco-cms/backoffice/style";
import { UMB_CONTENT_WORKSPACE_CONTEXT as at } from "@umbraco-cms/backoffice/content";
import { UMB_NOTIFICATION_CONTEXT as st } from "@umbraco-cms/backoffice/notification";
import { V as m, a as u } from "./validation-workspace-context-DCPpyFQL.js";
var nt = Object.defineProperty, rt = Object.getOwnPropertyDescriptor, O = (t) => {
  throw TypeError(t);
}, h = (t, i, s, r) => {
  for (var l = r > 1 ? void 0 : r ? rt(i, s) : i, C = t.length - 1, w; C >= 0; C--)
    (w = t[C]) && (l = (r ? w(i, s, l) : w(l)) || l);
  return r && l && nt(i, s, l), l;
}, R = (t, i, s) => i.has(t) || O("Cannot " + s), o = (t, i, s) => (R(t, i, "read from private field"), i.get(t)), f = (t, i, s) => i.has(t) ? O("Cannot add the same private member more than once") : i instanceof WeakSet ? i.add(t) : i.set(t, s), E = (t, i, s, r) => (R(t, i, "write to private field"), i.set(t, s), s), a = (t, i, s) => (R(t, i, "access private method"), s), y, c, g, e, T, $, A, D, W, N, P, L, v, x, k, U, F, Y, b, B, S, X, z, H, K, G, J, Q, Z, q;
const ot = 500, lt = 1e3, ut = 2e3, M = {
  [u.Error]: 0,
  [u.Warning]: 1,
  [u.Info]: 2
}, ct = {
  [u.Error]: "danger",
  [u.Warning]: "warning",
  [u.Info]: "default"
}, I = /* @__PURE__ */ new Map();
let V = 0, d = class extends it {
  constructor() {
    super(), f(this, e), f(this, y), this._isValidating = !1, f(this, c), f(this, g), f(this, x, async () => {
      await a(this, e, v).call(this);
    }), f(this, k, async () => {
      if (this._documentId && this._validationResult?.hasValidator !== !1)
        try {
          if (await a(this, e, v).call(this), (await this.getContext(m))?.hasBlockingErrors(this._currentCulture)) {
            await a(this, e, b).call(this, "danger", "Cannot Publish", "Validation errors must be resolved first");
            return;
          }
          await a(this, e, B).call(this);
        } catch (t) {
          await a(this, e, b).call(this, "danger", "Error", t instanceof Error ? t.message : "Save and publish failed");
        }
    }), E(this, y, V++), setTimeout(() => {
      V > 1 && (V = 0);
    }, ut), a(this, e, T).call(this), a(this, e, L).call(this);
  }
  willUpdate(t) {
    super.willUpdate(t), t.has("_validationResult") && (this._sortedMessages = a(this, e, U).call(this), this._messageCounts = a(this, e, F).call(this));
  }
  connectedCallback() {
    super.connectedCallback();
    const t = this._documentId ? I.get(this._documentId) ?? !1 : !1;
    this._documentId && (t ? a(this, e, v).call(this, { skipSave: !0 }) : (I.set(this._documentId, !0), a(this, e, v).call(this, { useDelay: !0, skipSave: !0 })));
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
                            ${a(this, e, Q).call(this)}
                            ${a(this, e, q).call(this)}
                        </uui-box>
                    ` : p}

                    ${a(this, e, z).call(this)}
                </div>
            </umb-body-layout>
        `;
  }
};
y = /* @__PURE__ */ new WeakMap();
c = /* @__PURE__ */ new WeakMap();
g = /* @__PURE__ */ new WeakMap();
e = /* @__PURE__ */ new WeakSet();
T = function() {
  this.consumeContext(at, (t) => {
    t && (E(this, c, t), a(this, e, $).call(this, t), a(this, e, D).call(this, t));
  });
};
$ = function(t) {
  this.observe(
    t.splitView.activeVariantsInfo,
    async (i) => {
      if (i && i.length > 0) {
        const s = a(this, e, A).call(this, i.length), l = i[s]?.culture ?? void 0;
        this._currentCulture !== l && (this._currentCulture = l, await a(this, e, P).call(this));
      } else
        this._currentCulture = void 0;
    }
  );
};
A = function(t) {
  return t > 1 ? Math.min(o(this, y), t - 1) : 0;
};
D = function(t) {
  this.observe(
    t.unique,
    async (i) => {
      const s = a(this, e, W).call(this, i);
      this._documentId = i ?? void 0, E(this, g, i ?? void 0), await a(this, e, N).call(this), s && i && I.delete(i);
    }
  );
};
W = function(t) {
  return o(this, g) !== void 0 && o(this, g) !== t;
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
      (i) => {
        this._isValidating = i;
      }
    );
  });
};
v = async function(t = {}) {
  if (this._documentId && this._validationResult?.hasValidator !== !1)
    try {
      const i = await this.getContext(m);
      if (!i) return;
      const s = async () => {
        try {
          !t.skipSave && o(this, c)?.requestSubmit && (await o(this, c).requestSubmit(), await a(this, e, S).call(this, ot)), await i.validateManually(this._documentId, this._currentCulture), this._validationResult = i.getValidationResult(this._currentCulture);
        } catch (r) {
          console.debug("Validation skipped:", r);
        }
      };
      t.useDelay && await a(this, e, S).call(this, lt), await s();
    } catch (i) {
      console.error("Failed to validate and update result:", i);
    }
};
x = /* @__PURE__ */ new WeakMap();
k = /* @__PURE__ */ new WeakMap();
U = function() {
  if (this._validationResult?.messages)
    return [...this._validationResult.messages].sort(
      (t, i) => M[t.severity] - M[i.severity]
    );
};
F = function() {
  return this._validationResult ? {
    errors: this._validationResult.messages.filter((t) => t.severity === u.Error).length,
    warnings: this._validationResult.messages.filter((t) => t.severity === u.Warning).length
  } : { errors: 0, warnings: 0 };
};
Y = function() {
  return this._validationResult?.messages.some(
    (t) => t.severity === u.Error || t.severity === u.Warning
  ) ?? !1;
};
b = async function(t, i, s) {
  try {
    (await this.getContext(st))?.peek(t, {
      data: { headline: i, message: s }
    });
  } catch (r) {
    console.error("Failed to show notification:", r);
  }
};
B = async function() {
  try {
    o(this, c) && "publish" in o(this, c) && typeof o(this, c).publish == "function" && await o(this, c).publish();
  } catch (t) {
    throw console.error("Failed to publish document:", t), t;
  }
};
S = function(t) {
  return new Promise((i) => setTimeout(i, t));
};
X = function(t) {
  return ct[t];
};
z = function() {
  return this._isValidating || !this._validationResult ? a(this, e, H).call(this) : this._validationResult.hasValidator ? n`
            <uui-box headline="Validation Results" headline-variant="h5">
                ${a(this, e, Y).call(this) ? p : a(this, e, G).call(this)}
                <div>
                    ${j(
    this._sortedMessages ?? [],
    (t) => t.message,
    (t) => a(this, e, J).call(this, t)
  )}
                </div>
            </uui-box>
        ` : a(this, e, K).call(this);
};
H = function() {
  return n`
            <uui-box headline="Status" headline-variant="h5">
                <div style="display: flex; align-items: center; gap: var(--uui-size-space-3);">
                    <uui-loader></uui-loader>
                    <span>Validating...</span>
                </div>
            </uui-box>
        `;
};
K = function() {
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
J = function(t) {
  const i = a(this, e, X).call(this, t.severity);
  return n`
            <p>
                <uui-tag color=${i} look="primary">
                    ${t.severity}
                </uui-tag>
                ${t.message}
            </p>
        `;
};
Q = function() {
  const { errors: t, warnings: i } = this._messageCounts ?? { errors: 0, warnings: 0 };
  return n`
            <div slot="headline">
                ${a(this, e, Z).call(this, t)}
                Document Validation
            </div>
            <div slot="header-actions">
                ${t > 0 ? n`
                    <uui-tag color="danger" look="primary">${t}</uui-tag>
                ` : p}
                ${i > 0 ? n`
                    <uui-tag color="warning" look="primary">${i}</uui-tag>
                ` : p}
            </div>
        `;
};
Z = function(t) {
  return t > 0 ? n`<uui-icon name="icon-delete" style="color: var(--uui-color-danger);"></uui-icon>` : n`<uui-icon name="icon-check" style="color: var(--uui-color-positive);"></uui-icon>`;
};
q = function() {
  return n`
            <uui-button-group>
                <uui-button
                    look="primary"
                    color="default"
                    label="Save & Validate"
                    @click=${o(this, x)}
                    ?disabled=${!this._documentId || this._isValidating}>
                    Save & Validate
                </uui-button>
                <uui-button
                    look="primary"
                    color="positive"
                    label="Validate & Publish"
                    @click=${o(this, k)}
                    ?disabled=${!this._documentId || this._isValidating}>
                    Validate & Publish
                </uui-button>
                ${this._isValidating ? n`<uui-loader></uui-loader>` : p}
            </uui-button-group>
        `;
};
d.styles = [et];
h([
  _()
], d.prototype, "_documentId", 2);
h([
  _()
], d.prototype, "_validationResult", 2);
h([
  _()
], d.prototype, "_isValidating", 2);
h([
  _()
], d.prototype, "_currentCulture", 2);
h([
  _()
], d.prototype, "_sortedMessages", 2);
h([
  _()
], d.prototype, "_messageCounts", 2);
d = h([
  tt("custom-validator-workspace-view")
], d);
export {
  d as CustomValidatorWorkspaceView,
  d as element
};
//# sourceMappingURL=validation-view.element-BXKNHWzD.js.map
