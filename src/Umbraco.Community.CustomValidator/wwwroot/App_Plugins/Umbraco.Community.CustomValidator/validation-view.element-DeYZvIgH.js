import { nothing as v, html as o, repeat as B, state as y, customElement as J } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as Q } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as Z } from "@umbraco-cms/backoffice/style";
import { UMB_CONTENT_WORKSPACE_CONTEXT as q } from "@umbraco-cms/backoffice/content";
import { V as S, a as c } from "./validation-workspace-context-CwidAw2f.js";
var tt = Object.defineProperty, et = Object.getOwnPropertyDescriptor, M = (t) => {
  throw TypeError(t);
}, f = (t, e, i, a) => {
  for (var l = a > 1 ? void 0 : a ? et(e, i) : e, u = t.length - 1, r; u >= 0; u--)
    (r = t[u]) && (l = (a ? r(e, i, l) : r(l)) || l);
  return a && l && tt(e, i, l), l;
}, I = (t, e, i) => e.has(t) || M("Cannot " + i), h = (t, e, i) => (I(t, e, "read from private field"), e.get(t)), _ = (t, e, i) => e.has(t) ? M("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), E = (t, e, i, a) => (I(t, e, "write to private field"), e.set(t, i), i), n = (t, e, i) => (I(t, e, "access private method"), i), k, p, b, s, W, D, A, T, L, N, P, U, g, O, w, K, R, Y, j, x, z, F, G, H, X;
const it = 500, at = 1e3, $ = {
  [c.Error]: 0,
  [c.Warning]: 1,
  [c.Info]: 2
}, st = {
  [c.Error]: "danger",
  [c.Warning]: "warning",
  [c.Info]: "default"
}, V = /* @__PURE__ */ new Map(), C = [];
let nt = 0, d = class extends Q {
  constructor() {
    super(), _(this, s), _(this, k), this._validationResults = {}, this._isValidating = !1, this._cultureReady = !1, _(this, p), _(this, b), _(this, O, async () => {
      await n(this, s, g).call(this, { skipSave: !1 }), window.dispatchEvent(new CustomEvent("custom-validator:validate-all", { detail: { skipSave: !0 } }));
    }), _(this, w, async (t) => {
      if (this.isConnected && this._documentId) {
        let e = !0;
        t instanceof CustomEvent && typeof t.detail?.skipSave == "boolean" && (e = t.detail.skipSave), await n(this, s, g).call(this, { skipSave: e });
      }
    }), E(this, k, nt++), C.push(this), n(this, s, W).call(this), n(this, s, U).call(this), window.addEventListener("custom-validator:validate-all", h(this, w));
  }
  willUpdate(t) {
    super.willUpdate(t), t.has("_validationResult");
  }
  connectedCallback() {
    if (super.connectedCallback(), !this._cultureReady)
      return;
    const t = n(this, s, A).call(this), e = t ? V.get(t) ?? !1 : !1;
    this._documentId && (e ? n(this, s, g).call(this, { skipSave: !0 }) : (t && V.set(t, !0), n(this, s, g).call(this, { useDelay: !0, skipSave: !0 })));
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    const t = C.indexOf(this);
    t !== -1 && C.splice(t, 1), window.removeEventListener("custom-validator:validate-all", h(this, w));
  }
  render() {
    const t = Object.values(this._validationResults).some((e) => e.hasValidator !== !1);
    return o`
            <umb-body-layout header-transparent header-fit-height>
                <div style="display: flex; flex-direction: column; gap: var(--uui-size-layout-1);">
                    ${t ? o`
                        <uui-box headline-variant="h4">
                            ${n(this, s, G).call(this)}
                            ${n(this, s, X).call(this)}
                        </uui-box>
                    ` : v}

                    ${n(this, s, j).call(this)}
                </div>
            </umb-body-layout>
        `;
  }
};
k = /* @__PURE__ */ new WeakMap();
p = /* @__PURE__ */ new WeakMap();
b = /* @__PURE__ */ new WeakMap();
s = /* @__PURE__ */ new WeakSet();
W = function() {
  this.consumeContext(q, (t) => {
    t && (E(this, p, t), n(this, s, D).call(this, t), n(this, s, T).call(this, t));
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
      const a = Math.max(0, Math.min(i, e.length - 1)), u = e[a]?.culture ?? void 0;
      this._currentCulture !== u ? (this._currentCulture = u, this._cultureReady = !0, await n(this, s, P).call(this)) : this._cultureReady || (this._cultureReady = !0);
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
      const i = n(this, s, L).call(this, e);
      this._documentId = e ?? void 0, E(this, b, e ?? void 0), await n(this, s, N).call(this), i && e && Array.from(V.keys()).filter((l) => l.startsWith(`${e}|`)).forEach((l) => V.delete(l));
    }
  );
};
L = function(t) {
  return h(this, b) !== void 0 && h(this, b) !== t;
};
N = async function() {
  try {
    const t = await this.getContext(S);
    t && t.clearValidation();
  } catch (t) {
    console.error("Failed to clear validation on document switch:", t);
  }
};
P = async function() {
  try {
    const t = await this.getContext(S);
    if (t) {
      const e = Object.keys(this._validationResults), i = {};
      for (const a of e) {
        const l = t.getValidationResult(a === "default" ? void 0 : a);
        l && (i[a] = l);
      }
      this._validationResults = i;
    }
  } catch (t) {
    console.error("Failed to load cached validation result:", t);
  }
};
U = function() {
  this.consumeContext(S, (t) => {
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
      const e = await this.getContext(S);
      if (!e) return;
      const i = async () => {
        try {
          !t.skipSave && h(this, p)?.requestSubmit && (await h(this, p).requestSubmit(), await n(this, s, R).call(this, it));
          let a;
          const l = h(this, p)?.splitView;
          let u = [];
          l && typeof l.activeVariantsInfo.subscribe == "function" && l.activeVariantsInfo.subscribe((m) => {
            u = m;
          }), u.length > 1 && (a = u.map((m) => m.culture ?? void 0));
          const r = await e.validateManually(this._documentId, this._currentCulture, a);
          this._validationResults = r, this._activeCulture = this._currentCulture ?? "default";
        } catch (a) {
          console.debug("Validation skipped:", a);
        }
      };
      t.useDelay && await n(this, s, R).call(this, at), await i();
    } catch (e) {
      console.error("Failed to validate and update result:", e);
    }
};
O = /* @__PURE__ */ new WeakMap();
w = /* @__PURE__ */ new WeakMap();
K = function(t) {
  const e = t && t.length > 0 ? t : Object.keys(this._validationResults);
  let i = 0, a = 0;
  for (const l of e) {
    const u = this._validationResults[l];
    u && (i += u.messages.filter((r) => r.severity === c.Error).length, a += u.messages.filter((r) => r.severity === c.Warning).length);
  }
  return { errors: i, warnings: a };
};
R = function(t) {
  return new Promise((e) => setTimeout(e, t));
};
Y = function(t) {
  return st[t];
};
j = function() {
  if (this._isValidating)
    return n(this, s, x).call(this);
  const t = Object.keys(this._validationResults);
  if (t.length === 0)
    return n(this, s, x).call(this);
  const e = t.length > 1 ? t : [this._activeCulture ?? "default"];
  return o`
            <div style="display: flex; gap: var(--uui-size-layout-1); flex-direction: column;">
                ${e.map((i) => {
    const a = this._validationResults[i];
    if (!a) return v;
    if (!a.hasValidator)
      return o`<uui-box headline="${i.toUpperCase()}" headline-variant="h5">${n(this, s, z).call(this)}</uui-box>`;
    const l = [...a.messages].sort((r, m) => $[r.severity] - $[m.severity]), u = a.messages.some((r) => r.severity === c.Error || r.severity === c.Warning);
    return o`
                        <uui-box headline="Validation Results" headline-variant="h5">

                            ${i !== "default" ? o`
                                <div slot="header-actions">
                                    <uui-tag color="default" look="primary">${i}</uui-tag>
                                </div>` : v}

                            ${u ? v : n(this, s, F).call(this)}
                            <uui-table aria-label="Validation Messages">
                                <uui-table-head>
                                    <uui-table-head-cell style="width: 120px;">Severity</uui-table-head-cell>
                                    <uui-table-head-cell>Message</uui-table-head-cell>
                                </uui-table-head>
                                ${B(
      l,
      (r) => r.message,
      (r) => o`
                                        <uui-table-row>
                                            <uui-table-cell>
                                                <uui-tag color=${n(this, s, Y).call(this, r.severity)} look="primary">
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
  return o`
            <uui-box headline="Status" headline-variant="h5">
                <div style="display: flex; align-items: center; gap: var(--uui-size-space-3);">
                    <uui-loader></uui-loader>
                    <span>Validating...</span>
                </div>
            </uui-box>
        `;
};
z = function(t) {
  const e = t ? this._validationResults[t] : void 0;
  return o`
            <uui-box headline="Status" headline-variant="h5">
                <p>No validation configured for this content type (${e?.contentTypeAlias ?? ""}).</p>
            </uui-box>
        `;
};
F = function() {
  return o`
            <p style="color: var(--uui-color-positive);">
                <uui-icon name="icon-check"></uui-icon>
                All validations passed successfully.
            </p>
        `;
};
G = function() {
  const t = Object.keys(this._validationResults), e = t.length > 1 ? t : [this._activeCulture ?? "default"], { errors: i, warnings: a } = n(this, s, K).call(this, e);
  return o`
            <div slot="headline">
                ${n(this, s, H).call(this, i)}
                Document Validation
            </div>
            <div slot="header-actions">
                ${i > 0 ? o`
                    <uui-tag color="danger" look="primary">${i}</uui-tag>
                ` : v}
                ${a > 0 ? o`
                    <uui-tag color="warning" look="primary">${a}</uui-tag>
                ` : v}
            </div>
        `;
};
H = function(t) {
  return t > 0 ? o`<uui-icon name="icon-delete" style="color: var(--uui-color-danger);"></uui-icon>` : o`<uui-icon name="icon-check" style="color: var(--uui-color-positive);"></uui-icon>`;
};
X = function() {
  return o`
            <uui-button-group>
                <uui-button
                    look="primary"
                    color="default"
                    label="Save & Validate"
                    @click=${h(this, O)}
                    ?disabled=${!this._documentId || this._isValidating}>
                    Save & Validate
                </uui-button>
                ${this._isValidating ? o`<uui-loader></uui-loader>` : v}
            </uui-button-group>
        `;
};
d.styles = [Z];
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
  J("custom-validator-workspace-view")
], d);
export {
  d as CustomValidatorWorkspaceView,
  d as element
};
//# sourceMappingURL=validation-view.element-DeYZvIgH.js.map
