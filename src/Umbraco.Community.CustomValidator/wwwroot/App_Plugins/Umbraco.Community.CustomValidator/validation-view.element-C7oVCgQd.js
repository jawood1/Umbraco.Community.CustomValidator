import { nothing as p, html as u, repeat as B, state as f, customElement as G } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as J } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as Q } from "@umbraco-cms/backoffice/style";
import { UMB_CONTENT_WORKSPACE_CONTEXT as Z } from "@umbraco-cms/backoffice/content";
import { V as w, a as c } from "./validation-workspace-context-DaTwn9M5.js";
var q = Object.defineProperty, tt = Object.getOwnPropertyDescriptor, D = (t) => {
  throw TypeError(t);
}, h = (t, e, i, a) => {
  for (var r = a > 1 ? void 0 : a ? tt(e, i) : e, o = t.length - 1, l; o >= 0; o--)
    (l = t[o]) && (r = (a ? l(e, i, r) : l(r)) || r);
  return a && r && q(e, i, r), r;
}, I = (t, e, i) => e.has(t) || D("Cannot " + i), v = (t, e, i) => (I(t, e, "read from private field"), i ? i.call(t) : e.get(t)), g = (t, e, i) => e.has(t) ? D("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), k = (t, e, i, a) => (I(t, e, "write to private field"), e.set(t, i), i), n = (t, e, i) => (I(t, e, "access private method"), i), R, _, m, s, M, W, T, A, N, L, U, P, b, O, $, x, K, Y, S, z, F, j, H, X;
const et = 500, it = 1e3, E = {
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
    super(), g(this, s), g(this, R), this._validationResults = {}, this._isValidating = !1, this._cultureReady = !1, g(this, _), g(this, m), g(this, O, async () => {
      await n(this, s, b).call(this);
    }), k(this, R, st++), C.push(this), n(this, s, M).call(this), n(this, s, P).call(this);
  }
  willUpdate(t) {
    super.willUpdate(t), t.has("_validationResult") && (this._messageCounts = n(this, s, $).call(this));
  }
  connectedCallback() {
    if (super.connectedCallback(), !this._cultureReady)
      return;
    const t = n(this, s, T).call(this), e = t ? V.get(t) ?? !1 : !1;
    this._documentId && (e ? n(this, s, b).call(this, { skipSave: !0 }) : (t && V.set(t, !0), n(this, s, b).call(this, { useDelay: !0, skipSave: !0 })));
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._messageCounts = void 0;
    const t = C.indexOf(this);
    t !== -1 && C.splice(t, 1);
  }
  render() {
    const t = Object.values(this._validationResults).some((e) => e.hasValidator !== !1);
    return u`
            <umb-body-layout header-transparent header-fit-height>
                <div style="display: flex; flex-direction: column; gap: var(--uui-size-layout-1);">
                    ${t ? u`
                        <uui-box headline-variant="h4">
                            ${n(this, s, j).call(this)}
                            ${n(this, s, X).call(this)}
                        </uui-box>
                    ` : p}

                    ${n(this, s, Y).call(this)}
                </div>
            </umb-body-layout>
        `;
  }
};
R = /* @__PURE__ */ new WeakMap();
_ = /* @__PURE__ */ new WeakMap();
m = /* @__PURE__ */ new WeakMap();
s = /* @__PURE__ */ new WeakSet();
M = function() {
  this.consumeContext(Z, (t) => {
    t && (k(this, _, t), n(this, s, W).call(this, t), n(this, s, A).call(this, t));
  });
};
W = function(t) {
  this.observe(
    t.splitView.activeVariantsInfo,
    async (e) => {
      if (!e || e.length === 0) {
        this._currentCulture = void 0, this._cultureReady = !0;
        return;
      }
      let i = C.indexOf(this);
      const a = Math.max(0, Math.min(i, e.length - 1)), o = e[a]?.culture ?? void 0;
      this._currentCulture !== o ? (this._currentCulture = o, this._cultureReady = !0, await n(this, s, U).call(this)) : this._cultureReady || (this._cultureReady = !0);
    }
  );
};
T = function() {
  if (this._documentId)
    return `${this._documentId}|${this._currentCulture ?? "undefined"}`;
};
A = function(t) {
  this.observe(
    t.unique,
    async (e) => {
      const i = n(this, s, N).call(this, e);
      this._documentId = e ?? void 0, k(this, m, e ?? void 0), await n(this, s, L).call(this), i && e && Array.from(V.keys()).filter((r) => r.startsWith(`${e}|`)).forEach((r) => V.delete(r));
    }
  );
};
N = function(t) {
  return v(this, m) !== void 0 && v(this, m) !== t;
};
L = async function() {
  try {
    const t = await this.getContext(w);
    t && t.clearValidation();
  } catch (t) {
    console.error("Failed to clear validation on document switch:", t);
  }
};
U = async function() {
  try {
    const t = await this.getContext(w);
    if (t) {
      const e = Object.keys(this._validationResults), i = {};
      for (const a of e) {
        const r = t.getValidationResult(a === "default" ? void 0 : a);
        r && (i[a] = r);
      }
      this._validationResults = i;
    }
  } catch (t) {
    console.error("Failed to load cached validation result:", t);
  }
};
P = function() {
  this.consumeContext(w, (t) => {
    t && this.observe(
      t.isValidating,
      (e) => {
        this._isValidating = e;
      }
    );
  });
};
b = async function(t = {}) {
  if (this._documentId)
    try {
      const e = await this.getContext(w);
      if (!e) return;
      const i = async () => {
        try {
          !t.skipSave && v(this, _)?.requestSubmit && (await v(this, _).requestSubmit(), await n(this, s, x).call(this, et));
          let a;
          const r = v(this, _)?.splitView;
          let o = [];
          r && typeof r.activeVariantsInfo.subscribe == "function" && r.activeVariantsInfo.subscribe((y) => {
            o = y;
          }), o.length > 1 && (a = o.map((y) => y.culture ?? void 0));
          const l = await e.validateManually(this._documentId, this._currentCulture, a);
          this._validationResults = l, this._activeCulture = this._currentCulture ?? "default";
        } catch (a) {
          console.debug("Validation skipped:", a);
        }
      };
      t.useDelay && await n(this, s, x).call(this, it), await i();
    } catch (e) {
      console.error("Failed to validate and update result:", e);
    }
};
O = /* @__PURE__ */ new WeakMap();
$ = function(t) {
  const e = t && t.length > 0 ? t : Object.keys(this._validationResults);
  let i = 0, a = 0;
  for (const r of e) {
    const o = this._validationResults[r];
    o && (i += o.messages.filter((l) => l.severity === c.Error).length, a += o.messages.filter((l) => l.severity === c.Warning).length);
  }
  return { errors: i, warnings: a };
};
x = function(t) {
  return new Promise((e) => setTimeout(e, t));
};
K = function(t) {
  return at[t];
};
Y = function() {
  if (this._isValidating)
    return n(this, s, S).call(this);
  const t = Object.keys(this._validationResults);
  if (t.length === 0)
    return n(this, s, S).call(this);
  const e = t.length > 1 ? t : [this._activeCulture ?? "default"];
  return u`
            <div style="display: flex; gap: var(--uui-size-layout-1); flex-direction: column;">
                ${e.map((i) => {
    const a = this._validationResults[i];
    if (!a) return p;
    if (!a.hasValidator)
      return u`<uui-box headline="${i.toUpperCase()}" headline-variant="h5">${n(this, s, z).call(this)}</uui-box>`;
    const r = [...a.messages].sort((l, y) => E[l.severity] - E[y.severity]), o = a.messages.some((l) => l.severity === c.Error || l.severity === c.Warning);
    return u`
                        <uui-box headline="${i.toUpperCase()} Validation Results" headline-variant="h5">
                            ${o ? p : n(this, s, F).call(this)}
                            <uui-table aria-label="Validation Messages">
                                <uui-table-head>
                                    <uui-table-head-cell style="width: 120px;">Severity</uui-table-head-cell>
                                    <uui-table-head-cell>Message</uui-table-head-cell>
                                </uui-table-head>
                                ${B(
      r,
      (l) => l.message,
      (l) => u`
                                        <uui-table-row>
                                            <uui-table-cell>
                                                <uui-tag color=${n(this, s, K).call(this, l.severity)} look="primary">
                                                    ${l.severity}
                                                </uui-tag>
                                            </uui-table-cell>
                                            <uui-table-cell>${l.message}</uui-table-cell>
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
S = function() {
  return u`
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
  return u`
            <uui-box headline="Status" headline-variant="h5">
                <p>No validation configured for this content type (${e?.contentTypeAlias ?? ""}).</p>
            </uui-box>
        `;
};
F = function() {
  return u`
            <p style="color: var(--uui-color-positive);">
                <uui-icon name="icon-check"></uui-icon>
                All validations passed successfully.
            </p>
        `;
};
j = function() {
  const t = Object.keys(this._validationResults), e = t.length > 1 ? t : [this._activeCulture ?? "default"], { errors: i, warnings: a } = n(this, s, $).call(this, e);
  return u`
            <div slot="headline">
                ${n(this, s, H).call(this, i)}
                Document Validation
            </div>
            <div slot="header-actions">
                ${i > 0 ? u`
                    <uui-tag color="danger" look="primary">${i}</uui-tag>
                ` : p}
                ${a > 0 ? u`
                    <uui-tag color="warning" look="primary">${a}</uui-tag>
                ` : p}
            </div>
        `;
};
H = function(t) {
  return t > 0 ? u`<uui-icon name="icon-delete" style="color: var(--uui-color-danger);"></uui-icon>` : u`<uui-icon name="icon-check" style="color: var(--uui-color-positive);"></uui-icon>`;
};
X = function() {
  return u`
            <uui-button-group>
                <uui-button
                    look="primary"
                    color="default"
                    label="Save & Validate"
                    @click=${v(this, O)}
                    ?disabled=${!this._documentId || this._isValidating}>
                    Save & Validate
                </uui-button>
                ${this._isValidating ? u`<uui-loader></uui-loader>` : p}
            </uui-button-group>
        `;
};
d.styles = [Q];
h([
  f()
], d.prototype, "_documentId", 2);
h([
  f()
], d.prototype, "_validationResults", 2);
h([
  f()
], d.prototype, "_activeCulture", 2);
h([
  f()
], d.prototype, "_isValidating", 2);
h([
  f()
], d.prototype, "_currentCulture", 2);
h([
  f()
], d.prototype, "_cultureReady", 2);
h([
  f()
], d.prototype, "_messageCounts", 2);
d = h([
  G("custom-validator-workspace-view")
], d);
export {
  d as CustomValidatorWorkspaceView,
  d as element
};
//# sourceMappingURL=validation-view.element-C7oVCgQd.js.map
