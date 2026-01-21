import { nothing as y, html as l, repeat as J, state as m, customElement as Q } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as Z } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as q } from "@umbraco-cms/backoffice/style";
import { UMB_CONTENT_WORKSPACE_CONTEXT as tt } from "@umbraco-cms/backoffice/content";
import { V as C, a as d } from "./validation-workspace-context-CexQJ1Gg.js";
var et = Object.defineProperty, it = Object.getOwnPropertyDescriptor, D = (t) => {
  throw TypeError(t);
}, f = (t, e, i, s) => {
  for (var o = s > 1 ? void 0 : s ? it(e, i) : e, c = t.length - 1, r; c >= 0; c--)
    (r = t[c]) && (o = (s ? r(e, i, o) : r(o)) || o);
  return s && o && et(e, i, o), o;
}, I = (t, e, i) => e.has(t) || D("Cannot " + i), u = (t, e, i) => (I(t, e, "read from private field"), e.get(t)), _ = (t, e, i) => e.has(t) ? D("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), R = (t, e, i, s) => (I(t, e, "write to private field"), e.set(t, i), i), n = (t, e, i) => (I(t, e, "access private method"), i), p, v, w, S, a, M, A, O, T, L, N, P, U, K, Y, b, $, V, j, x, z, F, E, B, G, H, X;
const at = 500, st = 1e3, W = {
  [d.Error]: 0,
  [d.Warning]: 1,
  [d.Info]: 2
}, nt = {
  [d.Error]: "danger",
  [d.Warning]: "warning",
  [d.Info]: "default"
}, k = /* @__PURE__ */ new Map();
let h = class extends Z {
  constructor() {
    super(), _(this, a), _(this, p), this.count = 0, this._validationResults = {}, this._isValidating = !1, this._cultureReady = !1, _(this, v), _(this, w), _(this, S, !1), _(this, $, async () => {
      await n(this, a, b).call(this, { skipSave: !1 }), window.dispatchEvent(new CustomEvent("custom-validator:validate-all", { detail: { skipSave: !0 } }));
    }), _(this, V, async (t) => {
      if (this.isConnected && this._documentId) {
        let e = !0;
        t instanceof CustomEvent && typeof t.detail?.skipSave == "boolean" && (e = t.detail.skipSave), await n(this, a, b).call(this, { skipSave: e });
      }
    }), this.consumeContext(C, (t) => {
      t && (R(this, p, t), n(this, a, M).call(this), t.increment());
    }), n(this, a, A).call(this), n(this, a, Y).call(this), window.addEventListener("custom-validator:validate-all", u(this, V));
  }
  willUpdate(t) {
    super.willUpdate(t), t.has("_validationResult");
  }
  connectedCallback() {
    if (super.connectedCallback(), !this._cultureReady)
      return;
    const t = n(this, a, L).call(this), e = t ? k.get(t) ?? !1 : !1;
    this._documentId && (e ? n(this, a, b).call(this, { skipSave: !0 }) : (t && k.set(t, !0), n(this, a, b).call(this, { useDelay: !0, skipSave: !0 })));
  }
  disconnectedCallback() {
    super.disconnectedCallback(), window.removeEventListener("custom-validator:validate-all", u(this, V)), u(this, p) && u(this, p).reset();
  }
  render() {
    const t = Object.values(this._validationResults).some((e) => e.hasValidator !== !1);
    return l`
            <umb-body-layout header-transparent header-fit-height>
                <div style="display: flex; flex-direction: column; gap: var(--uui-size-layout-1);">
                    ${t ? l`
                        <uui-box headline-variant="h4">
                            ${n(this, a, G).call(this)}
                            ${n(this, a, X).call(this)}
                        </uui-box>
                    ` : y}

                    ${n(this, a, F).call(this)}
                </div>
            </umb-body-layout>
        `;
  }
};
p = /* @__PURE__ */ new WeakMap();
v = /* @__PURE__ */ new WeakMap();
w = /* @__PURE__ */ new WeakMap();
S = /* @__PURE__ */ new WeakMap();
a = /* @__PURE__ */ new WeakSet();
M = function() {
  u(this, p) && this.observe(u(this, p).counter, (t) => {
    this.count = t - 1, console.log("Instance index:", this.count, "(from counter:", t + ")"), n(this, a, O).call(this);
  });
};
A = function() {
  this.consumeContext(tt, (t) => {
    t && (R(this, v, t), n(this, a, N).call(this, t), n(this, a, O).call(this));
  });
};
O = function() {
  u(this, S) || !u(this, v) || this.count < 0 || (R(this, S, !0), console.log("Setting up variant observer for instance:", this.count), n(this, a, T).call(this, u(this, v)));
};
T = function(t) {
  console.log("Observing variant at index:", this.count), this.observe(
    t.splitView.activeVariantByIndex(this.count),
    async (e) => {
      const i = e?.culture ?? void 0;
      console.log(`Instance ${this.count} - Culture:`, i, "Variant:", e), this._currentCulture !== i ? (this._currentCulture = i, this._cultureReady = !0, await n(this, a, K).call(this)) : this._cultureReady || (this._cultureReady = !0);
    }
  );
};
L = function() {
  if (this._documentId)
    return `${this._documentId}|${this._currentCulture ?? "undefined"}`;
};
N = function(t) {
  this.observe(
    t.unique,
    async (e) => {
      const i = n(this, a, P).call(this, e);
      this._documentId = e ?? void 0, R(this, w, e ?? void 0), await n(this, a, U).call(this), i && e && Array.from(k.keys()).filter((o) => o.startsWith(`${e}|`)).forEach((o) => k.delete(o));
    }
  );
};
P = function(t) {
  return u(this, w) !== void 0 && u(this, w) !== t;
};
U = async function() {
  try {
    const t = await this.getContext(C);
    t && t.clearValidation();
  } catch (t) {
    console.error("Failed to clear validation on document switch:", t);
  }
};
K = async function() {
  try {
    const t = await this.getContext(C);
    if (t) {
      const e = Object.keys(this._validationResults), i = {};
      for (const s of e) {
        const o = t.getValidationResult(s === "default" ? void 0 : s);
        o && (i[s] = o);
      }
      this._validationResults = i;
    }
  } catch (t) {
    console.error("Failed to load cached validation result:", t);
  }
};
Y = function() {
  this.consumeContext(C, (t) => {
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
      const e = await this.getContext(C);
      if (!e) return;
      const i = async () => {
        try {
          !t.skipSave && u(this, v)?.requestSubmit && (await u(this, v).requestSubmit(), await n(this, a, x).call(this, at));
          let s;
          const o = u(this, v)?.splitView;
          let c = [];
          o && typeof o.activeVariantsInfo.subscribe == "function" && o.activeVariantsInfo.subscribe((g) => {
            c = g;
          }), c.length > 1 && (s = c.map((g) => g.culture ?? void 0));
          const r = await e.validateManually(this._documentId, this._currentCulture, s);
          this._validationResults = r, this._activeCulture = this._currentCulture ?? "default";
        } catch (s) {
          console.debug("Validation skipped:", s);
        }
      };
      t.useDelay && await n(this, a, x).call(this, st), await i();
    } catch (e) {
      console.error("Failed to validate and update result:", e);
    }
};
$ = /* @__PURE__ */ new WeakMap();
V = /* @__PURE__ */ new WeakMap();
j = function(t) {
  const e = t && t.length > 0 ? t : Object.keys(this._validationResults);
  let i = 0, s = 0;
  for (const o of e) {
    const c = this._validationResults[o];
    c && (i += c.messages.filter((r) => r.severity === d.Error).length, s += c.messages.filter((r) => r.severity === d.Warning).length);
  }
  return { errors: i, warnings: s };
};
x = function(t) {
  return new Promise((e) => setTimeout(e, t));
};
z = function(t) {
  return nt[t];
};
F = function() {
  if (this._isValidating)
    return n(this, a, E).call(this);
  const t = Object.keys(this._validationResults);
  if (t.length === 0)
    return n(this, a, E).call(this);
  const e = t.length > 1 ? t : [this._activeCulture ?? "default"];
  return l`
            <div style="display: flex; gap: var(--uui-size-layout-1); flex-direction: column;">
                ${e.map((i) => {
    const s = this._validationResults[i];
    if (!s) return y;
    if (!s.hasValidator)
      return l`
                        <uui-box headline="Status" headline-variant="h5">
                            <p>No custom validation configured for this document.</p>
                        </uui-box>`;
    const o = [...s.messages].sort((r, g) => W[r.severity] - W[g.severity]), c = s.messages.some((r) => r.severity === d.Error || r.severity === d.Warning);
    return l`
                        <uui-box headline="Validation Results" headline-variant="h5">

                            ${i !== "default" ? l`
                                <div slot="header-actions">
                                    <uui-tag color="default" look="primary">${i}</uui-tag>
                                </div>` : y}

                            ${c ? y : n(this, a, B).call(this)}
                            <uui-table aria-label="Validation Messages">
                                <uui-table-head>
                                    <uui-table-head-cell style="width: 120px;">Severity</uui-table-head-cell>
                                    <uui-table-head-cell>Message</uui-table-head-cell>
                                </uui-table-head>
                                ${J(
      o,
      (r) => r.message,
      (r) => l`
                                        <uui-table-row>
                                            <uui-table-cell>
                                                <uui-tag color=${n(this, a, z).call(this, r.severity)} look="primary">
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
E = function() {
  return l`
            <uui-box headline="Status" headline-variant="h5">
                <div style="display: flex; align-items: center; gap: var(--uui-size-space-3);">
                    <uui-loader></uui-loader>
                    <span>Validating...</span>
                </div>
            </uui-box>
        `;
};
B = function() {
  return l`
            <p style="color: var(--uui-color-positive);">
                <uui-icon name="icon-check"></uui-icon>
                All validations passed successfully.
            </p>
        `;
};
G = function() {
  const t = Object.keys(this._validationResults), e = t.length > 1 ? t : [this._activeCulture ?? "default"], { errors: i, warnings: s } = n(this, a, j).call(this, e);
  return l`
            <div slot="headline">
                ${n(this, a, H).call(this, i)}
                Document Validation
            </div>
            <div slot="header-actions">
                ${i > 0 ? l`
                    <uui-tag color="danger" look="primary">${i}</uui-tag>
                ` : y}
                ${s > 0 ? l`
                    <uui-tag color="warning" look="primary">${s}</uui-tag>
                ` : y}
            </div>
        `;
};
H = function(t) {
  return t > 0 ? l`<uui-icon name="icon-delete" style="color: var(--uui-color-danger);"></uui-icon>` : l`<uui-icon name="icon-check" style="color: var(--uui-color-positive);"></uui-icon>`;
};
X = function() {
  return l`
            <uui-button-group>
                <uui-button
                    look="primary"
                    color="default"
                    label="Save & Validate"
                    @click=${u(this, $)}
                    ?disabled=${!this._documentId || this._isValidating}>
                    Save & Validate
                </uui-button>
                ${this._isValidating ? l`<uui-loader></uui-loader>` : y}
            </uui-button-group>
        `;
};
h.styles = [q];
f([
  m()
], h.prototype, "count", 2);
f([
  m()
], h.prototype, "_documentId", 2);
f([
  m()
], h.prototype, "_validationResults", 2);
f([
  m()
], h.prototype, "_activeCulture", 2);
f([
  m()
], h.prototype, "_isValidating", 2);
f([
  m()
], h.prototype, "_currentCulture", 2);
f([
  m()
], h.prototype, "_cultureReady", 2);
h = f([
  Q("custom-validator-workspace-view")
], h);
export {
  h as CustomValidatorWorkspaceView,
  h as element
};
//# sourceMappingURL=validation-view.element-E9Yq-3SM.js.map
