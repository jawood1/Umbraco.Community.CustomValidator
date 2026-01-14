import { nothing as n, html as a, repeat as S, state as p, customElement as A } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as M } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as W } from "@umbraco-cms/backoffice/style";
import { UMB_CONTENT_WORKSPACE_CONTEXT as I } from "@umbraco-cms/backoffice/content";
import { UMB_DOCUMENT_WORKSPACE_CONTEXT as N } from "@umbraco-cms/backoffice/document";
import { VALIDATION_WORKSPACE_CONTEXT as v } from "./validation-workspace-context-Dzg7J8I0.js";
var P = Object.defineProperty, D = Object.getOwnPropertyDescriptor, b = (t) => {
  throw TypeError(t);
}, h = (t, i, e, c) => {
  for (var s = c > 1 ? void 0 : c ? D(i, e) : i, _ = t.length - 1, f; _ >= 0; _--)
    (f = t[_]) && (s = (c ? f(i, e, s) : f(s)) || s);
  return c && s && P(i, e, s), s;
}, y = (t, i, e) => i.has(t) || b("Cannot " + e), d = (t, i, e) => (y(t, i, "read from private field"), e ? e.call(t) : i.get(t)), m = (t, i, e) => i.has(t) ? b("Cannot add the same private member more than once") : i instanceof WeakSet ? i.add(t) : i.set(t, e), U = (t, i, e, c) => (y(t, i, "write to private field"), i.set(t, e), e), o = (t, i, e) => (y(t, i, "access private method"), e), u, r, w, C, g, x, V, $, E, R, T, k, O;
let l = class extends M {
  constructor() {
    super(), m(this, r), this._isValidating = !1, m(this, u), m(this, g, async () => {
      if (!this._documentId) return;
      const t = await this.getContext(v);
      if (t) {
        this._error = void 0;
        try {
          d(this, u)?.requestSubmit && (await d(this, u).requestSubmit(), await new Promise((i) => setTimeout(i, 500))), await t.validateManually(this._documentId);
        } catch (i) {
          this._error = i instanceof Error ? i.message : "Validation failed";
        }
      }
    }), this.consumeContext(N, (t) => {
      t && U(this, u, t);
    }), this.consumeContext(I, (t) => {
      t && this.observe(
        t.unique,
        (i) => {
          this._documentId = i ?? void 0, i && o(this, r, w).call(this, i);
        }
      );
    }), this.consumeContext(v, (t) => {
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
    super.connectedCallback(), this._documentId && o(this, r, C).call(this);
  }
  render() {
    return a`
            <umb-body-layout header-transparent header-fit-height>
                <div style="display: flex; flex-direction: column; gap: var(--uui-size-layout-1);">
                    <uui-box headline-variant="h4">
                        ${o(this, r, O).call(this)}
                        <uui-button-group>
                            <uui-button
                                look="primary"
                                color="positive"
                                label="Validate Document"
                                @click=${d(this, g)}
                                ?disabled=${!this._documentId || this._isValidating}>
                                <uui-icon name="icon-check"></uui-icon>
                                Validate Document
                            </uui-button>
                            ${this._isValidating ? a`<uui-loader></uui-loader>` : n}
                        </uui-button-group>
                    </uui-box>

                    ${o(this, r, V).call(this)}
                    ${o(this, r, $).call(this)}
                    ${o(this, r, E).call(this)}
                </div>
            </umb-body-layout>
        `;
  }
};
u = /* @__PURE__ */ new WeakMap();
r = /* @__PURE__ */ new WeakSet();
w = async function(t) {
  const i = await this.getContext(v);
  i && setTimeout(async () => {
    try {
      await i.validateManually(t);
    } catch (e) {
      console.debug("Auto-validation skipped:", e);
    }
  }, 1e3);
};
C = async function() {
  if (!this._documentId) return;
  const t = await this.getContext(v);
  if (t)
    try {
      d(this, u)?.requestSubmit && (await d(this, u).requestSubmit(), await new Promise((i) => setTimeout(i, 500))), await t.validateManually(this._documentId);
    } catch (i) {
      console.debug("Auto-validation on tab switch skipped:", i);
    }
};
g = /* @__PURE__ */ new WeakMap();
x = function(t) {
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
  return this._error ? a`
            <uui-box headline="Error" headline-variant="h5">
                <p><strong style="color: var(--uui-color-danger);">${this._error}</strong></p>
            </uui-box>
        ` : n;
};
$ = function() {
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
E = function() {
  return !this._validationResult || this._validationResult.messages.length === 0 ? n : a`
            <uui-box headline="Validation Results" headline-variant="h5">
                <div>
                    ${S(
    this._validationResult.messages,
    (t) => t.message,
    (t) => o(this, r, R).call(this, t)
  )}
                </div>
            </uui-box>
        `;
};
R = function(t) {
  const i = o(this, r, x).call(this, t.severity);
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
T = function() {
  return this._validationResult ? this._validationResult.messages.filter((t) => t.severity === "Error").length : 0;
};
k = function() {
  return this._validationResult ? this._validationResult.messages.filter((t) => t.severity === "Warning").length : 0;
};
O = function() {
  const t = o(this, r, T).call(this), i = o(this, r, k).call(this);
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
l.styles = [W];
h([
  p()
], l.prototype, "_documentId", 2);
h([
  p()
], l.prototype, "_validationResult", 2);
h([
  p()
], l.prototype, "_isValidating", 2);
h([
  p()
], l.prototype, "_error", 2);
l = h([
  A("my-validation-workspace-view")
], l);
export {
  l as MyValidationWorkspaceView,
  l as element
};
//# sourceMappingURL=validation-view.element-BfWe9BAi.js.map
