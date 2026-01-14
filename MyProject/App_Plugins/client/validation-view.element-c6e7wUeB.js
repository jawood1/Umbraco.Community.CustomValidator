import { nothing as h, html as a, repeat as k, state as p, customElement as E } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as O } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as A } from "@umbraco-cms/backoffice/style";
import { UMB_CONTENT_WORKSPACE_CONTEXT as M } from "@umbraco-cms/backoffice/content";
import { UMB_DOCUMENT_WORKSPACE_CONTEXT as W } from "@umbraco-cms/backoffice/document";
import { VALIDATION_WORKSPACE_CONTEXT as d } from "./validation-workspace-context-Dzg7J8I0.js";
var I = Object.defineProperty, P = Object.getOwnPropertyDescriptor, b = (t) => {
  throw TypeError(t);
}, v = (t, i, e, l) => {
  for (var n = l > 1 ? void 0 : l ? P(i, e) : i, _ = t.length - 1, f; _ >= 0; _--)
    (f = t[_]) && (n = (l ? f(i, e, n) : f(n)) || n);
  return l && n && I(i, e, n), n;
}, g = (t, i, e) => i.has(t) || b("Cannot " + e), c = (t, i, e) => (g(t, i, "read from private field"), e ? e.call(t) : i.get(t)), m = (t, i, e) => i.has(t) ? b("Cannot add the same private member more than once") : i instanceof WeakSet ? i.add(t) : i.set(t, e), N = (t, i, e, l) => (g(t, i, "write to private field"), i.set(t, e), e), r = (t, i, e) => (g(t, i, "access private method"), e), s, o, x, w, y, C, V, R, $, S, T;
let u = class extends O {
  constructor() {
    super(), m(this, o), this._isValidating = !1, m(this, s), m(this, y, async () => {
      if (!this._documentId) return;
      const t = await this.getContext(d);
      if (t && (this._error = void 0, this._validationResult?.hasValidator !== !1))
        try {
          c(this, s)?.requestSubmit && (await c(this, s).requestSubmit(), await new Promise((i) => setTimeout(i, 500))), await t.validateManually(this._documentId);
        } catch (i) {
          this._error = i instanceof Error ? i.message : "Validation failed";
        }
    }), this.consumeContext(W, (t) => {
      t && N(this, s, t);
    }), this.consumeContext(M, (t) => {
      t && this.observe(
        t.unique,
        async (i) => {
          this._documentId = i ?? void 0;
          const e = await this.getContext(d);
          e && e.clearValidation(), i && r(this, o, x).call(this, i);
        }
      );
    }), this.consumeContext(d, (t) => {
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
    super.connectedCallback(), this._documentId && r(this, o, w).call(this);
  }
  render() {
    return a`
            <umb-body-layout header-transparent header-fit-height>
                <div style="display: flex; flex-direction: column; gap: var(--uui-size-layout-1);">
                    ${this._validationResult?.hasValidator !== !1 && this._validationResult !== void 0 ? a`
                        <uui-box headline-variant="h4">
                            ${r(this, o, T).call(this)}
                            <uui-button-group>
                                <uui-button
                                    look="primary"
                                    color="positive"
                                    label="Validate Document"
                                    @click=${c(this, y)}
                                    ?disabled=${!this._documentId || this._isValidating}>
                                    <uui-icon name="icon-check"></uui-icon>
                                    Validate Document
                                </uui-button>
                                ${this._isValidating ? a`<uui-loader></uui-loader>` : h}
                            </uui-button-group>
                        </uui-box>
                    ` : h}

                    ${r(this, o, V).call(this)}
                </div>
            </umb-body-layout>
        `;
  }
};
s = /* @__PURE__ */ new WeakMap();
o = /* @__PURE__ */ new WeakSet();
x = async function(t) {
  const i = await this.getContext(d);
  i && setTimeout(async () => {
    try {
      await i.validateManually(t);
    } catch (e) {
      console.debug("Auto-validation skipped:", e);
    }
  }, 1e3);
};
w = async function() {
  if (!this._documentId) return;
  const t = await this.getContext(d);
  if (t && this._validationResult?.hasValidator !== !1)
    try {
      c(this, s)?.requestSubmit && (await c(this, s).requestSubmit(), await new Promise((i) => setTimeout(i, 500))), await t.validateManually(this._documentId);
    } catch (i) {
      console.debug("Auto-validation on tab switch skipped:", i);
    }
};
y = /* @__PURE__ */ new WeakMap();
C = function(t) {
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
V = function() {
  return this._isValidating ? a`
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
            ` : this._validationResult ? this._validationResult.hasValidator ? this._validationResult.messages.length === 0 ? a`
                <uui-box headline="Validation Results" headline-variant="h5">
                    <p style="color: var(--uui-color-positive);">
                        <uui-icon name="icon-check"></uui-icon>
                        All validations passed successfully.
                    </p>
                </uui-box>
            ` : a`
            <uui-box headline="Validation Results" headline-variant="h5">
                <div>
                    ${k(
    this._validationResult.messages,
    (t) => t.message,
    (t) => r(this, o, R).call(this, t)
  )}
                </div>
            </uui-box>
        ` : a`
                <uui-box headline="Status" headline-variant="h5">
                    <p>No validation configured for this content type (${this._validationResult.contentTypeAlias}).</p>
                </uui-box>
            ` : a`
                <uui-box headline="Status" headline-variant="h5">
                    <p style="color: var(--uui-color-text-alt);">Ready to validate</p>
                </uui-box>
            `;
};
R = function(t) {
  const i = r(this, o, C).call(this, t.severity);
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
$ = function() {
  return this._validationResult ? this._validationResult.messages.filter((t) => t.severity === "Error").length : 0;
};
S = function() {
  return this._validationResult ? this._validationResult.messages.filter((t) => t.severity === "Warning").length : 0;
};
T = function() {
  const t = r(this, o, $).call(this), i = r(this, o, S).call(this);
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
  p()
], u.prototype, "_documentId", 2);
v([
  p()
], u.prototype, "_validationResult", 2);
v([
  p()
], u.prototype, "_isValidating", 2);
v([
  p()
], u.prototype, "_error", 2);
u = v([
  E("my-validation-workspace-view")
], u);
export {
  u as MyValidationWorkspaceView,
  u as element
};
//# sourceMappingURL=validation-view.element-c6e7wUeB.js.map
