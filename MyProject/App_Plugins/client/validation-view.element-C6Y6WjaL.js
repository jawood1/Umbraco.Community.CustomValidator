import { nothing as n, html as a, repeat as k, state as c, customElement as A } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as O } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as T } from "@umbraco-cms/backoffice/style";
import { UMB_CONTENT_WORKSPACE_CONTEXT as M } from "@umbraco-cms/backoffice/content";
import { VALIDATION_WORKSPACE_CONTEXT as p } from "./validation-workspace-context-Dzg7J8I0.js";
var W = Object.defineProperty, I = Object.getOwnPropertyDescriptor, g = (t) => {
  throw TypeError(t);
}, u = (t, i, e, d) => {
  for (var s = d > 1 ? void 0 : d ? I(i, e) : i, h = t.length - 1, v; h >= 0; h--)
    (v = t[h]) && (s = (d ? v(i, e, s) : v(s)) || s);
  return d && s && W(i, e, s), s;
}, y = (t, i, e) => i.has(t) || g("Cannot " + e), N = (t, i, e) => (y(t, i, "read from private field"), e ? e.call(t) : i.get(t)), f = (t, i, e) => i.has(t) ? g("Cannot add the same private member more than once") : i instanceof WeakSet ? i.add(t) : i.set(t, e), o = (t, i, e) => (y(t, i, "access private method"), e), r, m, _, V, b, C, x, $, w, R, E;
let l = class extends O {
  constructor() {
    super(), f(this, r), this._isValidating = !1, f(this, _, async () => {
      if (!this._documentId) return;
      const t = await this.getContext(p);
      if (t) {
        this._error = void 0;
        try {
          await t.validateManually(this._documentId);
        } catch (i) {
          this._error = i instanceof Error ? i.message : "Validation failed";
        }
      }
    }), this.consumeContext(M, (t) => {
      t && this.observe(
        t.unique,
        (i) => {
          this._documentId = i ?? void 0, i && o(this, r, m).call(this, i);
        }
      );
    }), this.consumeContext(p, (t) => {
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
  render() {
    return a`
            <umb-body-layout header-transparent header-fit-height>
                <div style="display: flex; flex-direction: column; gap: var(--uui-size-layout-1);">
                    <uui-box headline-variant="h4">
                        ${o(this, r, E).call(this)}
                        <uui-button-group>
                            <uui-button
                                look="primary"
                                color="positive"
                                label="Validate Document"
                                @click=${N(this, _)}
                                ?disabled=${!this._documentId || this._isValidating}>
                                <uui-icon name="icon-check"></uui-icon>
                                Validate Document
                            </uui-button>
                            ${this._isValidating ? a`<uui-loader></uui-loader>` : n}
                        </uui-button-group>
                    </uui-box>

                    ${o(this, r, b).call(this)}
                    ${o(this, r, C).call(this)}
                    ${o(this, r, x).call(this)}
                </div>
            </umb-body-layout>
        `;
  }
};
r = /* @__PURE__ */ new WeakSet();
m = async function(t) {
  const i = await this.getContext(p);
  i && setTimeout(async () => {
    try {
      await i.validateManually(t);
    } catch (e) {
      console.debug("Auto-validation skipped:", e);
    }
  }, 1e3);
};
_ = /* @__PURE__ */ new WeakMap();
V = function(t) {
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
b = function() {
  return this._error ? a`
            <uui-box headline="Error" headline-variant="h5">
                <p><strong style="color: var(--uui-color-danger);">${this._error}</strong></p>
            </uui-box>
        ` : n;
};
C = function() {
  return this._validationResult ? this._validationResult.hasValidator ? this._validationResult.messages.length === 0 ? a`
                <uui-box headline="Validation Complete" headline-variant="h5">
                    <p style="color: var(--uui-color-positive);">
                        <uui-icon name="icon-check"></uui-icon>
                        All validations passed successfully.
                    </p>
                </uui-box>
            ` : n : a`
                <uui-box headline="No Validator Available" headline-variant="h5">
                    <p>No validation configured for this content type (${this._validationResult.contentTypeAlias}).</p>
                </uui-box>
            ` : n;
};
x = function() {
  return !this._validationResult || this._validationResult.messages.length === 0 ? n : a`
            <uui-box headline="Validation Results" headline-variant="h5">
                <div>
                    ${k(
    this._validationResult.messages,
    (t) => t.message,
    (t) => o(this, r, $).call(this, t)
  )}
                </div>
            </uui-box>
        `;
};
$ = function(t) {
  const i = o(this, r, V).call(this, t.severity);
  return a`
            <p>
                <uui-tag color=${i} look="primary">
                    ${t.severity}
                </uui-tag>
                ${t.message}
                ${t.propertyAlias ? a`
                    <span style="color: var(--uui-color-text-alt);">(${t.propertyAlias})</span>
                ` : n}
            </p>
        `;
};
w = function() {
  return this._validationResult ? this._validationResult.messages.filter((t) => t.severity === "Error").length : 0;
};
R = function() {
  return this._validationResult ? this._validationResult.messages.filter((t) => t.severity === "Warning").length : 0;
};
E = function() {
  const t = o(this, r, w).call(this), i = o(this, r, R).call(this);
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
                ` : n}
                ${i > 0 ? a`
                    <uui-tag color="warning" look="primary">${i}</uui-tag>
                ` : n}
            </div>
        `;
};
l.styles = [T];
u([
  c()
], l.prototype, "_documentId", 2);
u([
  c()
], l.prototype, "_validationResult", 2);
u([
  c()
], l.prototype, "_isValidating", 2);
u([
  c()
], l.prototype, "_error", 2);
l = u([
  A("my-validation-workspace-view")
], l);
export {
  l as MyValidationWorkspaceView,
  l as element
};
//# sourceMappingURL=validation-view.element-C6Y6WjaL.js.map
