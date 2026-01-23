import { LitElement as K, nothing as _, html as n, repeat as X, state as f, customElement as q } from "@umbraco-cms/backoffice/external/lit";
import { UmbElementMixin as F } from "@umbraco-cms/backoffice/element-api";
import { UmbTextStyles as J } from "@umbraco-cms/backoffice/style";
import { UMB_CONTENT_WORKSPACE_CONTEXT as Q } from "@umbraco-cms/backoffice/content";
import { VALIDATION_WORKSPACE_CONTEXT as R } from "./validation-workspace-context-C5LC-9vh.js";
var o = /* @__PURE__ */ ((t) => (t.Error = "Error", t.Warning = "Warning", t.Info = "Info", t))(o || {}), Z = Object.defineProperty, j = Object.getOwnPropertyDescriptor, M = (t) => {
  throw TypeError(t);
}, v = (t, e, i, l) => {
  for (var d = l > 1 ? void 0 : l ? j(e, i) : e, S = t.length - 1, V; S >= 0; S--)
    (V = t[S]) && (d = (l ? V(e, i, d) : V(d)) || d);
  return l && d && Z(e, i, d), d;
}, k = (t, e, i) => e.has(t) || M("Cannot " + i), r = (t, e, i) => (k(t, e, "read from private field"), e.get(t)), c = (t, e, i) => e.has(t) ? M("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), g = (t, e, i, l) => (k(t, e, "write to private field"), e.set(t, i), i), s = (t, e, i) => (k(t, e, "access private method"), i), p, h, y, w, m, a, O, I, $, A, D, T, C, x, b, L, E, N, P, U, Y, z, B, G, H;
const tt = 500, et = 1e3, W = {
  [o.Error]: 0,
  [o.Warning]: 1,
  [o.Info]: 2
}, it = {
  [o.Error]: "danger",
  [o.Warning]: "warning",
  [o.Info]: "default"
};
let u = class extends F(K) {
  constructor() {
    super(), c(this, a), c(this, p), c(this, h), c(this, y), c(this, w, !1), c(this, m, !1), this.instanceCount = 0, this._isValidating = !1, this._cultureReady = !1, c(this, x, async () => {
      await s(this, a, C).call(this, { skipSave: !1 }), window.dispatchEvent(new CustomEvent("custom-validator:validate-all", { detail: { skipSave: !0 } }));
    }), c(this, b, async (t) => {
      if (this.isConnected && this._documentId) {
        let e = !0;
        t instanceof CustomEvent && typeof t.detail?.skipSave == "boolean" && (e = t.detail.skipSave), await s(this, a, C).call(this, { skipSave: e });
      }
    }), this.consumeContext(R, (t) => {
      t && (g(this, p, t), this.observe(t.instanceCounter, (e) => {
        r(this, m) || (g(this, m, !0), this.instanceCount = e, t.incrementInstance(), s(this, a, I).call(this));
      }));
    }), s(this, a, O).call(this), s(this, a, T).call(this), window.addEventListener("custom-validator:validate-all", r(this, b));
  }
  willUpdate(t) {
    super.willUpdate(t), t.has("_validationResult");
  }
  connectedCallback() {
    super.connectedCallback();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), window.removeEventListener("custom-validator:validate-all", r(this, b)), r(this, p) && r(this, p).resetInstanceCounter();
  }
  render() {
    const t = this._validationResult?.hasValidator !== !1 && this._validationResult !== void 0;
    return n`
            <umb-body-layout header-transparent header-fit-height>
                <div style="display: flex; flex-direction: column; gap: var(--uui-size-layout-1);">
                    ${t ? n`
                        <uui-box headline-variant="h4">
                            ${s(this, a, B).call(this)}
                            ${s(this, a, H).call(this)}
                        </uui-box>
                    ` : _}

                    ${s(this, a, P).call(this)}
                </div>
            </umb-body-layout>
        `;
  }
};
p = /* @__PURE__ */ new WeakMap();
h = /* @__PURE__ */ new WeakMap();
y = /* @__PURE__ */ new WeakMap();
w = /* @__PURE__ */ new WeakMap();
m = /* @__PURE__ */ new WeakMap();
a = /* @__PURE__ */ new WeakSet();
O = function() {
  this.consumeContext(Q, (t) => {
    t && (g(this, h, t), s(this, a, A).call(this, t), s(this, a, I).call(this));
  });
};
I = function() {
  r(this, w) || !r(this, h) || !r(this, m) || (g(this, w, !0), s(this, a, $).call(this, r(this, h)));
};
$ = function(t) {
  this.observe(
    t.splitView.activeVariantByIndex(this.instanceCount),
    async (e) => {
      const i = e?.culture ?? void 0, l = this._currentCulture !== i;
      this._currentCulture = i, this._cultureReady || (this._cultureReady = !0), this._documentId && (l || !this._validationResult) && await s(this, a, C).call(this, { useDelay: !0, skipSave: !0 });
    }
  );
};
A = function(t) {
  this.observe(
    t.unique,
    (e) => {
      s(this, a, D).call(this, e) && (this._validationResult = void 0), this._documentId = e ?? void 0, g(this, y, e ?? void 0);
    }
  );
};
D = function(t) {
  return r(this, y) !== void 0 && r(this, y) !== t;
};
T = function() {
  this.consumeContext(R, (t) => {
    t && this.observe(
      t.isValidating,
      (e) => {
        this._isValidating = e;
      }
    );
  });
};
C = async function(t = {}) {
  if (this._documentId)
    try {
      const e = await this.getContext(R);
      if (!e) return;
      const i = async () => {
        try {
          !t.skipSave && r(this, h)?.requestSubmit && (await r(this, h).requestSubmit(), await s(this, a, E).call(this, tt));
          const l = await e.validateManually(this._documentId, this._currentCulture);
          this._validationResult = l;
        } catch (l) {
          console.debug("Validation skipped:", l);
        }
      };
      t.useDelay && await s(this, a, E).call(this, et), await i();
    } catch (e) {
      console.error("Failed to validate and update result:", e);
    }
};
x = /* @__PURE__ */ new WeakMap();
b = /* @__PURE__ */ new WeakMap();
L = function() {
  return this._validationResult ? {
    errors: this._validationResult.messages.filter((t) => t.severity === o.Error).length,
    warnings: this._validationResult.messages.filter((t) => t.severity === o.Warning).length
  } : { errors: 0, warnings: 0 };
};
E = function(t) {
  return new Promise((e) => setTimeout(e, t));
};
N = function(t) {
  return it[t];
};
P = function() {
  if (this._isValidating || !this._validationResult)
    return s(this, a, Y).call(this);
  if (!this._validationResult.hasValidator)
    return n`
                <uui-box headline="Status" headline-variant="h5">
                    <p>No custom validation configured for this document.</p>
                </uui-box>`;
  const t = this._validationResult.messages.some(
    (e) => e.severity === o.Error || e.severity === o.Warning
  );
  return n`
            <uui-box headline="Validation Results" headline-variant="h5">
                ${t ? _ : s(this, a, z).call(this)}
                ${this._validationResult.messages.length > 0 ? s(this, a, U).call(this, this._validationResult.messages) : _}
            </uui-box>
        `;
};
U = function(t) {
  const e = [...t].sort((i, l) => W[i.severity] - W[l.severity]);
  return n`
        <uui-table aria-label="Validation Messages">
                    <uui-table-head>
                        <uui-table-head-cell style="width: 120px;">Severity</uui-table-head-cell>
                        <uui-table-head-cell>Message</uui-table-head-cell>
                    </uui-table-head>
                    ${X(
    e ?? [],
    (i) => i.message,
    (i) => n`
                            <uui-table-row>
                                <uui-table-cell>
                                    <uui-tag color=${s(this, a, N).call(this, i.severity)} look="primary">
                                        ${i.severity}
                                    </uui-tag>
                                </uui-table-cell>
                                <uui-table-cell>${i.message}</uui-table-cell>
                            </uui-table-row>
                        `
  )}
        </uui-table>`;
};
Y = function() {
  return n`
            <uui-box headline="Status" headline-variant="h5">
                <div style="display: flex; align-items: center; gap: var(--uui-size-space-3);">
                    <uui-loader></uui-loader>
                    <span>Validating...</span>
                </div>
            </uui-box>
        `;
};
z = function() {
  return n`
            <p style="color: var(--uui-color-positive);">
                <uui-icon name="icon-check"></uui-icon>
                All validations passed successfully.
            </p>
        `;
};
B = function() {
  const { errors: t, warnings: e } = s(this, a, L).call(this);
  return n`
            <div slot="headline">
                ${s(this, a, G).call(this, t)}
                Document Validation
            </div>
            <div slot="header-actions">
                ${t > 0 ? n`
                    <uui-tag color="danger" look="primary">${t}</uui-tag>
                ` : _}
                ${e > 0 ? n`
                    <uui-tag color="warning" look="primary">${e}</uui-tag>
                ` : _}
            </div>
        `;
};
G = function(t) {
  return t > 0 ? n`<uui-icon name="icon-delete" style="color: var(--uui-color-danger);"></uui-icon>` : n`<uui-icon name="icon-check" style="color: var(--uui-color-positive);"></uui-icon>`;
};
H = function() {
  return n`
            <uui-button-group>
                <uui-button
                    look="primary"
                    color="default"
                    label="Save & Validate"
                    @click=${r(this, x)}
                    ?disabled=${!this._documentId || this._isValidating}>
                    Save & Validate
                </uui-button>
                ${this._isValidating ? n`<uui-loader></uui-loader>` : _}
            </uui-button-group>
        `;
};
u.styles = [J];
v([
  f()
], u.prototype, "instanceCount", 2);
v([
  f()
], u.prototype, "_documentId", 2);
v([
  f()
], u.prototype, "_validationResult", 2);
v([
  f()
], u.prototype, "_isValidating", 2);
v([
  f()
], u.prototype, "_currentCulture", 2);
v([
  f()
], u.prototype, "_cultureReady", 2);
u = v([
  q("custom-validator-workspace-view")
], u);
export {
  u as CustomValidatorWorkspaceView,
  u as element
};
//# sourceMappingURL=validation-view.element-CRUWIUPv.js.map
