import { nothing as m, html as r, repeat as H, state as _, customElement as K } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as X } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as q } from "@umbraco-cms/backoffice/style";
import { UMB_CONTENT_WORKSPACE_CONTEXT as F } from "@umbraco-cms/backoffice/content";
import { VALIDATION_WORKSPACE_CONTEXT as k } from "./validation-workspace-context-C5LC-9vh.js";
var l = /* @__PURE__ */ ((t) => (t.Error = "Error", t.Warning = "Warning", t.Info = "Info", t))(l || {}), J = Object.defineProperty, Q = Object.getOwnPropertyDescriptor, O = (t) => {
  throw TypeError(t);
}, v = (t, e, i, o) => {
  for (var d = o > 1 ? void 0 : o ? Q(e, i) : e, S = t.length - 1, V; S >= 0; S--)
    (V = t[S]) && (d = (o ? V(e, i, d) : V(d)) || d);
  return o && d && J(e, i, d), d;
}, R = (t, e, i) => e.has(t) || O("Cannot " + i), n = (t, e, i) => (R(t, e, "read from private field"), e.get(t)), c = (t, e, i) => e.has(t) ? O("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), g = (t, e, i, o) => (R(t, e, "write to private field"), e.set(t, i), i), s = (t, e, i) => (R(t, e, "access private method"), i), f, h, y, w, p, a, M, I, $, A, D, T, C, x, b, L, E, N, P, U, Y, z, B, G;
const Z = 500, j = 1e3, W = {
  [l.Error]: 0,
  [l.Warning]: 1,
  [l.Info]: 2
}, tt = {
  [l.Error]: "danger",
  [l.Warning]: "warning",
  [l.Info]: "default"
};
let u = class extends X {
  constructor() {
    super(), c(this, a), c(this, f), c(this, h), c(this, y), c(this, w, !1), c(this, p, !1), this.instanceCount = 0, this._isValidating = !1, this._cultureReady = !1, c(this, x, async () => {
      await s(this, a, C).call(this, { skipSave: !1 }), window.dispatchEvent(new CustomEvent("custom-validator:validate-all", { detail: { skipSave: !0 } }));
    }), c(this, b, async (t) => {
      if (this.isConnected && this._documentId) {
        let e = !0;
        t instanceof CustomEvent && typeof t.detail?.skipSave == "boolean" && (e = t.detail.skipSave), await s(this, a, C).call(this, { skipSave: e });
      }
    }), this.consumeContext(k, (t) => {
      t && (g(this, f, t), this.observe(t.instanceCounter, (e) => {
        n(this, p) || (g(this, p, !0), this.instanceCount = e, t.incrementInstance(), s(this, a, I).call(this));
      }));
    }), s(this, a, M).call(this), s(this, a, T).call(this), window.addEventListener("custom-validator:validate-all", n(this, b));
  }
  willUpdate(t) {
    super.willUpdate(t), t.has("_validationResult");
  }
  connectedCallback() {
    super.connectedCallback();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), window.removeEventListener("custom-validator:validate-all", n(this, b)), n(this, f) && n(this, f).resetInstanceCounter();
  }
  render() {
    const t = this._validationResult?.hasValidator !== !1 && this._validationResult !== void 0;
    return r`
            <umb-body-layout header-transparent header-fit-height>
                <div style="display: flex; flex-direction: column; gap: var(--uui-size-layout-1);">
                    ${t ? r`
                        <uui-box headline-variant="h4">
                            ${s(this, a, z).call(this)}
                            ${s(this, a, G).call(this)}
                        </uui-box>
                    ` : m}

                    ${s(this, a, P).call(this)}
                </div>
            </umb-body-layout>
        `;
  }
};
f = /* @__PURE__ */ new WeakMap();
h = /* @__PURE__ */ new WeakMap();
y = /* @__PURE__ */ new WeakMap();
w = /* @__PURE__ */ new WeakMap();
p = /* @__PURE__ */ new WeakMap();
a = /* @__PURE__ */ new WeakSet();
M = function() {
  this.consumeContext(F, (t) => {
    t && (g(this, h, t), s(this, a, A).call(this, t), s(this, a, I).call(this));
  });
};
I = function() {
  n(this, w) || !n(this, h) || !n(this, p) || (g(this, w, !0), s(this, a, $).call(this, n(this, h)));
};
$ = function(t) {
  this.observe(
    t.splitView.activeVariantByIndex(this.instanceCount),
    async (e) => {
      const i = e?.culture ?? void 0, o = this._currentCulture !== i;
      this._currentCulture = i, this._cultureReady || (this._cultureReady = !0), this._documentId && (o || !this._validationResult) && await s(this, a, C).call(this, { useDelay: !0, skipSave: !0 });
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
  return n(this, y) !== void 0 && n(this, y) !== t;
};
T = function() {
  this.consumeContext(k, (t) => {
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
      const e = await this.getContext(k);
      if (!e) return;
      const i = async () => {
        try {
          !t.skipSave && n(this, h)?.requestSubmit && (await n(this, h).requestSubmit(), await s(this, a, E).call(this, Z));
          const o = await e.validateManually(this._documentId, this._currentCulture);
          this._validationResult = o;
        } catch (o) {
          console.debug("Validation skipped:", o);
        }
      };
      t.useDelay && await s(this, a, E).call(this, j), await i();
    } catch (e) {
      console.error("Failed to validate and update result:", e);
    }
};
x = /* @__PURE__ */ new WeakMap();
b = /* @__PURE__ */ new WeakMap();
L = function() {
  return this._validationResult ? {
    errors: this._validationResult.messages.filter((t) => t.severity === l.Error).length,
    warnings: this._validationResult.messages.filter((t) => t.severity === l.Warning).length
  } : { errors: 0, warnings: 0 };
};
E = function(t) {
  return new Promise((e) => setTimeout(e, t));
};
N = function(t) {
  return tt[t];
};
P = function() {
  if (this._isValidating || !this._validationResult)
    return s(this, a, U).call(this);
  if (!this._validationResult.hasValidator)
    return r`
                <uui-box headline="Status" headline-variant="h5">
                    <p>No custom validation configured for this document.</p>
                </uui-box>`;
  const t = this._validationResult.messages.some(
    (i) => i.severity === l.Error || i.severity === l.Warning
  ), e = [...this._validationResult.messages].sort((i, o) => W[i.severity] - W[o.severity]);
  return r`
            <uui-box headline="Validation Results" headline-variant="h5">
                ${t ? m : s(this, a, Y).call(this)}
                <uui-table aria-label="Validation Messages">
                    <uui-table-head>
                        <uui-table-head-cell style="width: 120px;">Severity</uui-table-head-cell>
                        <uui-table-head-cell>Message</uui-table-head-cell>
                    </uui-table-head>
                    ${H(
    e ?? [],
    (i) => i.message,
    (i) => r`
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
                </uui-table>
            </uui-box>
        `;
};
U = function() {
  return r`
            <uui-box headline="Status" headline-variant="h5">
                <div style="display: flex; align-items: center; gap: var(--uui-size-space-3);">
                    <uui-loader></uui-loader>
                    <span>Validating...</span>
                </div>
            </uui-box>
        `;
};
Y = function() {
  return r`
            <p style="color: var(--uui-color-positive);">
                <uui-icon name="icon-check"></uui-icon>
                All validations passed successfully.
            </p>
        `;
};
z = function() {
  const { errors: t, warnings: e } = s(this, a, L).call(this);
  return r`
            <div slot="headline">
                ${s(this, a, B).call(this, t)}
                Document Validation
            </div>
            <div slot="header-actions">
                ${t > 0 ? r`
                    <uui-tag color="danger" look="primary">${t}</uui-tag>
                ` : m}
                ${e > 0 ? r`
                    <uui-tag color="warning" look="primary">${e}</uui-tag>
                ` : m}
            </div>
        `;
};
B = function(t) {
  return t > 0 ? r`<uui-icon name="icon-delete" style="color: var(--uui-color-danger);"></uui-icon>` : r`<uui-icon name="icon-check" style="color: var(--uui-color-positive);"></uui-icon>`;
};
G = function() {
  return r`
            <uui-button-group>
                <uui-button
                    look="primary"
                    color="default"
                    label="Save & Validate"
                    @click=${n(this, x)}
                    ?disabled=${!this._documentId || this._isValidating}>
                    Save & Validate
                </uui-button>
                ${this._isValidating ? r`<uui-loader></uui-loader>` : m}
            </uui-button-group>
        `;
};
u.styles = [q];
v([
  _()
], u.prototype, "instanceCount", 2);
v([
  _()
], u.prototype, "_documentId", 2);
v([
  _()
], u.prototype, "_validationResult", 2);
v([
  _()
], u.prototype, "_isValidating", 2);
v([
  _()
], u.prototype, "_currentCulture", 2);
v([
  _()
], u.prototype, "_cultureReady", 2);
u = v([
  K("custom-validator-workspace-view")
], u);
export {
  u as CustomValidatorWorkspaceView,
  u as element
};
//# sourceMappingURL=validation-view.element-BP0PsCak.js.map
