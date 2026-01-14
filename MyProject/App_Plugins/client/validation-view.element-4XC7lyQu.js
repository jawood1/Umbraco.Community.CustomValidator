import { nothing as h, html as a, repeat as E, state as f, customElement as M } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as O } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as A } from "@umbraco-cms/backoffice/style";
import { UMB_CONTENT_WORKSPACE_CONTEXT as D } from "@umbraco-cms/backoffice/content";
import { VALIDATION_WORKSPACE_CONTEXT as c } from "./validation-workspace-context-Dzg7J8I0.js";
var P = Object.defineProperty, N = Object.getOwnPropertyDescriptor, x = (t) => {
  throw TypeError(t);
}, v = (t, i, e, n) => {
  for (var s = n > 1 ? void 0 : n ? N(i, e) : i, m = t.length - 1, g; m >= 0; m--)
    (g = t[m]) && (s = (n ? g(i, e, s) : g(s)) || s);
  return n && s && P(i, e, s), s;
}, b = (t, i, e) => i.has(t) || x("Cannot " + e), d = (t, i, e) => (b(t, i, "read from private field"), i.get(t)), p = (t, i, e) => i.has(t) ? x("Cannot add the same private member more than once") : i instanceof WeakSet ? i.add(t) : i.set(t, e), V = (t, i, e, n) => (b(t, i, "write to private field"), i.set(t, e), e), r = (t, i, e) => (b(t, i, "access private method"), e), l, _, o, C, R, w, $, I, k, S, T, W;
const y = /* @__PURE__ */ new Map();
let u = class extends O {
  constructor() {
    super(), p(this, o), this._isValidating = !1, p(this, l), p(this, _), p(this, w, async () => {
      if (!this._documentId) return;
      const t = await this.getContext(c);
      if (t && (this._error = void 0, this._validationResult?.hasValidator !== !1))
        try {
          d(this, l)?.requestSubmit && (await d(this, l).requestSubmit(), await new Promise((i) => setTimeout(i, 500))), await t.validateManually(this._documentId);
        } catch (i) {
          this._error = i instanceof Error ? i.message : "Validation failed";
        }
    }), this.consumeContext(D, (t) => {
      t && (V(this, l, t), this.observe(
        t.unique,
        async (i) => {
          const e = d(this, _);
          this._documentId = i ?? void 0, V(this, _, i ?? void 0);
          const n = await this.getContext(c);
          n && n.clearValidation(), e !== void 0 && e !== i && i && y.delete(i);
        }
      ));
    }), this.consumeContext(c, (t) => {
      t && (this.observe(
        t.validationResult,
        (i) => {
          this._validationResult = i;
        }
      ), this.observe(
        t.isValidating,
        (i) => {
          this._isValidating = i;
        }
      ));
    });
  }
  connectedCallback() {
    super.connectedCallback();
    const t = this._documentId ? y.get(this._documentId) ?? !1 : !1;
    this._documentId && (t ? r(this, o, R).call(this) : (y.set(this._documentId, !0), r(this, o, C).call(this)));
  }
  render() {
    return a`
            <umb-body-layout header-transparent header-fit-height>
                <div style="display: flex; flex-direction: column; gap: var(--uui-size-layout-1);">
                    ${this._validationResult?.hasValidator !== !1 && this._validationResult !== void 0 ? a`
                        <uui-box headline-variant="h4">
                            ${r(this, o, W).call(this)}
                            <uui-button-group>
                                <uui-button
                                    look="primary"
                                    color="positive"
                                    label="Validate Document"
                                    @click=${d(this, w)}
                                    ?disabled=${!this._documentId || this._isValidating}>
                                    <uui-icon name="icon-check"></uui-icon>
                                    Validate Document
                                </uui-button>
                                ${this._isValidating ? a`<uui-loader></uui-loader>` : h}
                            </uui-button-group>
                        </uui-box>
                    ` : h}

                    ${r(this, o, I).call(this)}
                </div>
            </umb-body-layout>
        `;
  }
};
l = /* @__PURE__ */ new WeakMap();
_ = /* @__PURE__ */ new WeakMap();
o = /* @__PURE__ */ new WeakSet();
C = async function() {
  if (!this._documentId) return;
  const t = await this.getContext(c);
  t && this._validationResult?.hasValidator !== !1 && setTimeout(async () => {
    try {
      await t.validateManually(this._documentId);
    } catch (i) {
      console.debug("Validation skipped:", i);
    }
  }, 1e3);
};
R = async function() {
  if (!this._documentId) return;
  const t = await this.getContext(c);
  if (t && this._validationResult?.hasValidator !== !1)
    try {
      d(this, l)?.requestSubmit && (await d(this, l).requestSubmit(), await new Promise((i) => setTimeout(i, 500))), await t.validateManually(this._documentId);
    } catch (i) {
      console.debug("Auto-validation on tab switch skipped:", i);
    }
};
w = /* @__PURE__ */ new WeakMap();
$ = function(t) {
  switch (t.toLowerCase()) {
    case "error":
      return "danger";
    case "warning":
      return "warning";
    case "info":
      return "positive";
    default:
      return "default";
  }
};
I = function() {
  return this._isValidating || !this._validationResult ? a`
                <uui-box headline="Status" headline-variant="h5">
                    <div style="display: flex; align-items: center; gap: var(--uui-size-space-3);">
                        <uui-loader></uui-loader>
                        <span>Validating...</span>
                    </div>
                </uui-box>
            ` : this._error ? a`
                <uui-box headline="Status" headline-variant="h5">
                    <p><strong style="color: var(--uui-color-danger);">${this._error}</strong></p>
                </uui-box>
            ` : this._validationResult.hasValidator ? this._validationResult.messages.length === 0 ? a`
                <uui-box headline="Validation Results" headline-variant="h5">
                    <p style="color: var(--uui-color-positive);">
                        <uui-icon name="icon-check"></uui-icon>
                        All validations passed successfully.
                    </p>
                </uui-box>
            ` : a`
            <uui-box headline="Validation Results" headline-variant="h5">
                <div>
                    ${E(
    this._validationResult.messages,
    (t) => t.message,
    (t) => r(this, o, k).call(this, t)
  )}
                </div>
            </uui-box>
        ` : a`
                <uui-box headline="Status" headline-variant="h5">
                    <p>No validation configured for this content type (${this._validationResult.contentTypeAlias}).</p>
                </uui-box>
            `;
};
k = function(t) {
  const i = r(this, o, $).call(this, t.severity);
  return a`
            <p>
                <uui-tag color=${i} look="primary">
                    ${t.severity}
                </uui-tag>
                ${t.message}
                ${t.propertyAlias ? a`
                    <span style="color: var(--uui-color-text-alt);">(${t.propertyAlias})</span>
                ` : h}
            </p>
        `;
};
S = function() {
  return this._validationResult ? this._validationResult.messages.filter((t) => t.severity === "Error").length : 0;
};
T = function() {
  return this._validationResult ? this._validationResult.messages.filter((t) => t.severity === "Warning").length : 0;
};
W = function() {
  const t = r(this, o, S).call(this), i = r(this, o, T).call(this);
  return a`
            <div slot="headline">
                ${t > 0 ? a`
                    <uui-icon name="icon-delete" style="color: var(--uui-color-danger);"></uui-icon>
                ` : a`
                    <uui-icon name="icon-check" style="color: var(--uui-color-positive);"></uui-icon>
                `}
                Document Validation
            </div>
            <div slot="header-actions">
                ${t > 0 ? a`
                    <uui-tag color="danger" look="primary">${t}</uui-tag>
                ` : h}
                ${i > 0 ? a`
                    <uui-tag color="warning" look="primary">${i}</uui-tag>
                ` : h}
            </div>
        `;
};
u.styles = [A];
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
], u.prototype, "_error", 2);
u = v([
  M("my-validation-workspace-view")
], u);
export {
  u as MyValidationWorkspaceView,
  u as element
};
//# sourceMappingURL=validation-view.element-4XC7lyQu.js.map
