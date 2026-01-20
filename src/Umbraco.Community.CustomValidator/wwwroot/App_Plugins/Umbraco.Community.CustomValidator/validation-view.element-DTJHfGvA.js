import { nothing as v, html as u, repeat as X, state as y, customElement as B } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as J } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as Q } from "@umbraco-cms/backoffice/style";
import { UMB_CONTENT_WORKSPACE_CONTEXT as Z } from "@umbraco-cms/backoffice/content";
import { V as k, a as c } from "./validation-workspace-context-4UeykxAn.js";
var q = Object.defineProperty, tt = Object.getOwnPropertyDescriptor, M = (t) => {
  throw TypeError(t);
}, f = (t, e, i, a) => {
  for (var n = a > 1 ? void 0 : a ? tt(e, i) : e, o = t.length - 1, r; o >= 0; o--)
    (r = t[o]) && (n = (a ? r(e, i, n) : r(n)) || n);
  return a && n && q(e, i, n), n;
}, I = (t, e, i) => e.has(t) || M("Cannot " + i), h = (t, e, i) => (I(t, e, "read from private field"), e.get(t)), _ = (t, e, i) => e.has(t) ? M("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), E = (t, e, i, a) => (I(t, e, "write to private field"), e.set(t, i), i), l = (t, e, i) => (I(t, e, "access private method"), i), S, p, b, s, W, D, A, T, L, N, P, U, g, O, w, K, R, Y, j, x, z, F, G, H;
const et = 500, it = 1e3, $ = {
  [c.Error]: 0,
  [c.Warning]: 1,
  [c.Info]: 2
}, at = {
  [c.Error]: "danger",
  [c.Warning]: "warning",
  [c.Info]: "default"
}, V = /* @__PURE__ */ new Map(), C = [];
let st = 0, d = class extends J {
  constructor() {
    super(), _(this, s), _(this, S), this._validationResults = {}, this._isValidating = !1, this._cultureReady = !1, _(this, p), _(this, b), _(this, O, async () => {
      await l(this, s, g).call(this, { skipSave: !1 }), window.dispatchEvent(new CustomEvent("custom-validator:validate-all", { detail: { skipSave: !0 } }));
    }), _(this, w, async (t) => {
      if (this.isConnected && this._documentId) {
        let e = !0;
        t instanceof CustomEvent && typeof t.detail?.skipSave == "boolean" && (e = t.detail.skipSave), await l(this, s, g).call(this, { skipSave: e });
      }
    }), E(this, S, st++), C.push(this), l(this, s, W).call(this), l(this, s, U).call(this), window.addEventListener("custom-validator:validate-all", h(this, w));
  }
  willUpdate(t) {
    super.willUpdate(t), t.has("_validationResult");
  }
  connectedCallback() {
    if (super.connectedCallback(), !this._cultureReady)
      return;
    const t = l(this, s, A).call(this), e = t ? V.get(t) ?? !1 : !1;
    this._documentId && (e ? l(this, s, g).call(this, { skipSave: !0 }) : (t && V.set(t, !0), l(this, s, g).call(this, { useDelay: !0, skipSave: !0 })));
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    const t = C.indexOf(this);
    t !== -1 && C.splice(t, 1), window.removeEventListener("custom-validator:validate-all", h(this, w));
  }
  render() {
    const t = Object.values(this._validationResults).some((e) => e.hasValidator !== !1);
    return u`
            <umb-body-layout header-transparent header-fit-height>
                <div style="display: flex; flex-direction: column; gap: var(--uui-size-layout-1);">
                    ${t ? u`
                        <uui-box headline-variant="h4">
                            ${l(this, s, F).call(this)}
                            ${l(this, s, H).call(this)}
                        </uui-box>
                    ` : v}

                    ${l(this, s, j).call(this)}
                </div>
            </umb-body-layout>
        `;
  }
};
S = /* @__PURE__ */ new WeakMap();
p = /* @__PURE__ */ new WeakMap();
b = /* @__PURE__ */ new WeakMap();
s = /* @__PURE__ */ new WeakSet();
W = function() {
  this.consumeContext(Z, (t) => {
    t && (E(this, p, t), l(this, s, D).call(this, t), l(this, s, T).call(this, t));
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
      let i = C.indexOf(this);
      const a = Math.max(0, Math.min(i, e.length - 1)), o = e[a]?.culture ?? void 0;
      this._currentCulture !== o ? (this._currentCulture = o, this._cultureReady = !0, await l(this, s, P).call(this)) : this._cultureReady || (this._cultureReady = !0);
    }
  );
};
A = function() {
  if (this._documentId)
    return `${this._documentId}|${this._currentCulture ?? "undefined"}`;
};
T = function(t) {
  this.observe(
    t.unique,
    async (e) => {
      const i = l(this, s, L).call(this, e);
      this._documentId = e ?? void 0, E(this, b, e ?? void 0), await l(this, s, N).call(this), i && e && Array.from(V.keys()).filter((n) => n.startsWith(`${e}|`)).forEach((n) => V.delete(n));
    }
  );
};
L = function(t) {
  return h(this, b) !== void 0 && h(this, b) !== t;
};
N = async function() {
  try {
    const t = await this.getContext(k);
    t && t.clearValidation();
  } catch (t) {
    console.error("Failed to clear validation on document switch:", t);
  }
};
P = async function() {
  try {
    const t = await this.getContext(k);
    if (t) {
      const e = Object.keys(this._validationResults), i = {};
      for (const a of e) {
        const n = t.getValidationResult(a === "default" ? void 0 : a);
        n && (i[a] = n);
      }
      this._validationResults = i;
    }
  } catch (t) {
    console.error("Failed to load cached validation result:", t);
  }
};
U = function() {
  this.consumeContext(k, (t) => {
    t && this.observe(
      t.isValidating,
      (e) => {
        this._isValidating = e;
      }
    );
  });
};
g = async function(t = {}) {
  if (this._documentId)
    try {
      const e = await this.getContext(k);
      if (!e) return;
      const i = async () => {
        try {
          !t.skipSave && h(this, p)?.requestSubmit && (await h(this, p).requestSubmit(), await l(this, s, R).call(this, et));
          let a;
          const n = h(this, p)?.splitView;
          let o = [];
          n && typeof n.activeVariantsInfo.subscribe == "function" && n.activeVariantsInfo.subscribe((m) => {
            o = m;
          }), o.length > 1 && (a = o.map((m) => m.culture ?? void 0));
          const r = await e.validateManually(this._documentId, this._currentCulture, a);
          this._validationResults = r, this._activeCulture = this._currentCulture ?? "default";
        } catch (a) {
          console.debug("Validation skipped:", a);
        }
      };
      t.useDelay && await l(this, s, R).call(this, it), await i();
    } catch (e) {
      console.error("Failed to validate and update result:", e);
    }
};
O = /* @__PURE__ */ new WeakMap();
w = /* @__PURE__ */ new WeakMap();
K = function(t) {
  const e = t && t.length > 0 ? t : Object.keys(this._validationResults);
  let i = 0, a = 0;
  for (const n of e) {
    const o = this._validationResults[n];
    o && (i += o.messages.filter((r) => r.severity === c.Error).length, a += o.messages.filter((r) => r.severity === c.Warning).length);
  }
  return { errors: i, warnings: a };
};
R = function(t) {
  return new Promise((e) => setTimeout(e, t));
};
Y = function(t) {
  return at[t];
};
j = function() {
  if (this._isValidating)
    return l(this, s, x).call(this);
  const t = Object.keys(this._validationResults);
  if (t.length === 0)
    return l(this, s, x).call(this);
  const e = t.length > 1 ? t : [this._activeCulture ?? "default"];
  return u`
            <div style="display: flex; gap: var(--uui-size-layout-1); flex-direction: column;">
                ${e.map((i) => {
    const a = this._validationResults[i];
    if (!a) return v;
    if (!a.hasValidator)
      return u`
                        <uui-box headline="Status" headline-variant="h5">
                            <p>No custom validation configured for this document.</p>
                        </uui-box>`;
    const n = [...a.messages].sort((r, m) => $[r.severity] - $[m.severity]), o = a.messages.some((r) => r.severity === c.Error || r.severity === c.Warning);
    return u`
                        <uui-box headline="Validation Results" headline-variant="h5">

                            ${i !== "default" ? u`
                                <div slot="header-actions">
                                    <uui-tag color="default" look="primary">${i}</uui-tag>
                                </div>` : v}

                            ${o ? v : l(this, s, z).call(this)}
                            <uui-table aria-label="Validation Messages">
                                <uui-table-head>
                                    <uui-table-head-cell style="width: 120px;">Severity</uui-table-head-cell>
                                    <uui-table-head-cell>Message</uui-table-head-cell>
                                </uui-table-head>
                                ${X(
      n,
      (r) => r.message,
      (r) => u`
                                        <uui-table-row>
                                            <uui-table-cell>
                                                <uui-tag color=${l(this, s, Y).call(this, r.severity)} look="primary">
                                                    ${r.severity}
                                                </uui-tag>
                                            </uui-table-cell>
                                            <uui-table-cell>${r.message}</uui-table-cell>
                                        </uui-table-row>
                                    `
    )}
                            </uui-table>
                        </uui-box>
                    `;
  })}
            </div>
        `;
};
x = function() {
  return u`
            <uui-box headline="Status" headline-variant="h5">
                <div style="display: flex; align-items: center; gap: var(--uui-size-space-3);">
                    <uui-loader></uui-loader>
                    <span>Validating...</span>
                </div>
            </uui-box>
        `;
};
z = function() {
  return u`
            <p style="color: var(--uui-color-positive);">
                <uui-icon name="icon-check"></uui-icon>
                All validations passed successfully.
            </p>
        `;
};
F = function() {
  const t = Object.keys(this._validationResults), e = t.length > 1 ? t : [this._activeCulture ?? "default"], { errors: i, warnings: a } = l(this, s, K).call(this, e);
  return u`
            <div slot="headline">
                ${l(this, s, G).call(this, i)}
                Document Validation
            </div>
            <div slot="header-actions">
                ${i > 0 ? u`
                    <uui-tag color="danger" look="primary">${i}</uui-tag>
                ` : v}
                ${a > 0 ? u`
                    <uui-tag color="warning" look="primary">${a}</uui-tag>
                ` : v}
            </div>
        `;
};
G = function(t) {
  return t > 0 ? u`<uui-icon name="icon-delete" style="color: var(--uui-color-danger);"></uui-icon>` : u`<uui-icon name="icon-check" style="color: var(--uui-color-positive);"></uui-icon>`;
};
H = function() {
  return u`
            <uui-button-group>
                <uui-button
                    look="primary"
                    color="default"
                    label="Save & Validate"
                    @click=${h(this, O)}
                    ?disabled=${!this._documentId || this._isValidating}>
                    Save & Validate
                </uui-button>
                ${this._isValidating ? u`<uui-loader></uui-loader>` : v}
            </uui-button-group>
        `;
};
d.styles = [Q];
f([
  y()
], d.prototype, "_documentId", 2);
f([
  y()
], d.prototype, "_validationResults", 2);
f([
  y()
], d.prototype, "_activeCulture", 2);
f([
  y()
], d.prototype, "_isValidating", 2);
f([
  y()
], d.prototype, "_currentCulture", 2);
f([
  y()
], d.prototype, "_cultureReady", 2);
d = f([
  B("custom-validator-workspace-view")
], d);
export {
  d as CustomValidatorWorkspaceView,
  d as element
};
//# sourceMappingURL=validation-view.element-DTJHfGvA.js.map
