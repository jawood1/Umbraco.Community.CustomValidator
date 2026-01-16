import { nothing as f, html as n, repeat as J, state as d, customElement as Q } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as Z } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as q } from "@umbraco-cms/backoffice/style";
import { UMB_CONTENT_WORKSPACE_CONTEXT as j } from "@umbraco-cms/backoffice/content";
import { V, a as o } from "./validation-workspace-context-BTUL9Nvg.js";
var tt = Object.defineProperty, et = Object.getOwnPropertyDescriptor, E = (t) => {
  throw TypeError(t);
}, c = (t, e, s, l) => {
  for (var r = l > 1 ? void 0 : l ? et(e, s) : e, h = t.length - 1, b; h >= 0; h--)
    (b = t[h]) && (r = (l ? b(e, s, r) : b(r)) || r);
  return l && r && tt(e, s, r), r;
}, S = (t, e, s) => e.has(t) || E("Cannot " + s), v = (t, e, s) => (S(t, e, "read from private field"), s ? s.call(t) : e.get(t)), _ = (t, e, s) => e.has(t) ? E("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, s), x = (t, e, s, l) => (S(t, e, "write to private field"), e.set(t, s), s), a = (t, e, s) => (S(t, e, "access private method"), s), w, p, y, i, M, O, $, D, W, T, A, N, g, I, L, P, U, R, K, Y, F, z, B, H, X, G;
const it = 500, at = 1e3, k = {
  [o.Error]: 0,
  [o.Warning]: 1,
  [o.Info]: 2
}, st = {
  [o.Error]: "danger",
  [o.Warning]: "warning",
  [o.Info]: "default"
}, C = /* @__PURE__ */ new Map(), m = [];
let nt = 0, u = class extends Z {
  constructor() {
    super(), _(this, i), _(this, w), this._isValidating = !1, this._cultureReady = !1, _(this, p), _(this, y), _(this, I, async () => {
      await a(this, i, g).call(this);
    }), x(this, w, nt++), m.push(this), a(this, i, M).call(this), a(this, i, N).call(this);
  }
  willUpdate(t) {
    super.willUpdate(t), t.has("_validationResult") && (this._sortedMessages = a(this, i, L).call(this), this._messageCounts = a(this, i, P).call(this));
  }
  connectedCallback() {
    if (super.connectedCallback(), !this._cultureReady)
      return;
    const t = a(this, i, $).call(this), e = t ? C.get(t) ?? !1 : !1;
    this._documentId && (e ? a(this, i, g).call(this, { skipSave: !0 }) : (t && C.set(t, !0), a(this, i, g).call(this, { useDelay: !0, skipSave: !0 })));
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._sortedMessages = void 0, this._messageCounts = void 0;
    const t = m.indexOf(this);
    t !== -1 && m.splice(t, 1);
  }
  render() {
    const t = this._validationResult?.hasValidator !== !1 && this._validationResult !== void 0;
    return n`
            <umb-body-layout header-transparent header-fit-height>
                <div style="display: flex; flex-direction: column; gap: var(--uui-size-layout-1);">
                    ${t ? n`
                        <uui-box headline-variant="h4">
                            ${a(this, i, H).call(this)}
                            ${a(this, i, G).call(this)}
                        </uui-box>
                    ` : f}

                    ${a(this, i, Y).call(this)}
                </div>
            </umb-body-layout>
        `;
  }
};
w = /* @__PURE__ */ new WeakMap();
p = /* @__PURE__ */ new WeakMap();
y = /* @__PURE__ */ new WeakMap();
i = /* @__PURE__ */ new WeakSet();
M = function() {
  this.consumeContext(j, (t) => {
    t && (x(this, p, t), a(this, i, O).call(this, t), a(this, i, D).call(this, t));
  });
};
O = function(t) {
  this.observe(
    t.splitView.activeVariantsInfo,
    async (e) => {
      if (!e || e.length === 0) {
        this._currentCulture = void 0, this._cultureReady = !0;
        return;
      }
      let s = m.indexOf(this);
      const l = Math.max(0, Math.min(s, e.length - 1)), h = e[l]?.culture ?? void 0;
      this._currentCulture !== h ? (this._currentCulture = h, this._cultureReady = !0, await a(this, i, A).call(this)) : this._cultureReady || (this._cultureReady = !0);
    }
  );
};
$ = function() {
  if (this._documentId)
    return `${this._documentId}|${this._currentCulture ?? "undefined"}`;
};
D = function(t) {
  this.observe(
    t.unique,
    async (e) => {
      const s = a(this, i, W).call(this, e);
      this._documentId = e ?? void 0, x(this, y, e ?? void 0), await a(this, i, T).call(this), s && e && Array.from(C.keys()).filter((r) => r.startsWith(`${e}|`)).forEach((r) => C.delete(r));
    }
  );
};
W = function(t) {
  return v(this, y) !== void 0 && v(this, y) !== t;
};
T = async function() {
  try {
    const t = await this.getContext(V);
    t && t.clearValidation();
  } catch (t) {
    console.error("Failed to clear validation on document switch:", t);
  }
};
A = async function() {
  try {
    const t = await this.getContext(V);
    t && (this._validationResult = t.getValidationResult(this._currentCulture));
  } catch (t) {
    console.error("Failed to load cached validation result:", t);
  }
};
N = function() {
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
          !t.skipSave && v(this, p)?.requestSubmit && (await v(this, p).requestSubmit(), await a(this, i, R).call(this, it)), await e.validateManually(this._documentId, this._currentCulture), this._validationResult = e.getValidationResult(this._currentCulture);
        } catch (l) {
          console.debug("Validation skipped:", l);
        }
      };
      t.useDelay && await a(this, i, R).call(this, at), await s();
    } catch (e) {
      console.error("Failed to validate and update result:", e);
    }
};
I = /* @__PURE__ */ new WeakMap();
L = function() {
  if (this._validationResult?.messages)
    return [...this._validationResult.messages].sort(
      (t, e) => k[t.severity] - k[e.severity]
    );
};
P = function() {
  return this._validationResult ? {
    errors: this._validationResult.messages.filter((t) => t.severity === o.Error).length,
    warnings: this._validationResult.messages.filter((t) => t.severity === o.Warning).length
  } : { errors: 0, warnings: 0 };
};
U = function() {
  return this._validationResult?.messages.some(
    (t) => t.severity === o.Error || t.severity === o.Warning
  ) ?? !1;
};
R = function(t) {
  return new Promise((e) => setTimeout(e, t));
};
K = function(t) {
  return st[t];
};
Y = function() {
  return this._isValidating || !this._validationResult ? a(this, i, F).call(this) : this._validationResult.hasValidator ? n`
            <uui-box headline="Validation Results" headline-variant="h5">
                ${a(this, i, U).call(this) ? f : a(this, i, B).call(this)}
                <uui-table aria-label="Validation Messages">
                    <uui-table-head>
                        <uui-table-head-cell style="width: 120px;">Severity</uui-table-head-cell>
                        <uui-table-head-cell>Message</uui-table-head-cell>
                    </uui-table-head>
                    ${J(
    this._sortedMessages ?? [],
    (t) => t.message,
    (t) => n`
                            <uui-table-row>
                                <uui-table-cell>
                                    <uui-tag color=${a(this, i, K).call(this, t.severity)} look="primary">
                                        ${t.severity}
                                    </uui-tag>
                                </uui-table-cell>
                                <uui-table-cell>${t.message}</uui-table-cell>
                            </uui-table-row>
                        `
  )}
                </uui-table>
            </uui-box>
        ` : a(this, i, z).call(this);
};
F = function() {
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
            <uui-box headline="Status" headline-variant="h5">
                <p>No validation configured for this content type (${this._validationResult?.contentTypeAlias}).</p>
            </uui-box>
        `;
};
B = function() {
  return n`
            <p style="color: var(--uui-color-positive);">
                <uui-icon name="icon-check"></uui-icon>
                All validations passed successfully.
            </p>
        `;
};
H = function() {
  const { errors: t, warnings: e } = this._messageCounts ?? { errors: 0, warnings: 0 };
  return n`
            <div slot="headline">
                ${a(this, i, X).call(this, t)}
                Document Validation
            </div>
            <div slot="header-actions">
                ${t > 0 ? n`
                    <uui-tag color="danger" look="primary">${t}</uui-tag>
                ` : f}
                ${e > 0 ? n`
                    <uui-tag color="warning" look="primary">${e}</uui-tag>
                ` : f}
            </div>
        `;
};
X = function(t) {
  return t > 0 ? n`<uui-icon name="icon-delete" style="color: var(--uui-color-danger);"></uui-icon>` : n`<uui-icon name="icon-check" style="color: var(--uui-color-positive);"></uui-icon>`;
};
G = function() {
  return n`
            <uui-button-group>
                <uui-button
                    look="primary"
                    color="default"
                    label="Save & Validate"
                    @click=${v(this, I)}
                    ?disabled=${!this._documentId || this._isValidating}>
                    Save & Validate
                </uui-button>
                ${this._isValidating ? n`<uui-loader></uui-loader>` : f}
            </uui-button-group>
        `;
};
u.styles = [q];
c([
  d()
], u.prototype, "_documentId", 2);
c([
  d()
], u.prototype, "_validationResult", 2);
c([
  d()
], u.prototype, "_isValidating", 2);
c([
  d()
], u.prototype, "_currentCulture", 2);
c([
  d()
], u.prototype, "_cultureReady", 2);
c([
  d()
], u.prototype, "_sortedMessages", 2);
c([
  d()
], u.prototype, "_messageCounts", 2);
u = c([
  Q("custom-validator-workspace-view")
], u);
export {
  u as CustomValidatorWorkspaceView,
  u as element
};
//# sourceMappingURL=validation-view.element-CixSG16E.js.map
