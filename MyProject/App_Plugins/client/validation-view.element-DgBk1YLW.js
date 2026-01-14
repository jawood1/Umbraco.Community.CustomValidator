import { nothing as l, html as r, repeat as $, state as c, customElement as E } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as R } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as O } from "@umbraco-cms/backoffice/style";
import { UMB_CONTENT_WORKSPACE_CONTEXT as T } from "@umbraco-cms/backoffice/content";
import { VALIDATION_WORKSPACE_CONTEXT as v } from "./validation-workspace-context-Dzg7J8I0.js";
var A = Object.defineProperty, M = Object.getOwnPropertyDescriptor, m = (t) => {
  throw TypeError(t);
}, u = (t, e, i, d) => {
  for (var s = d > 1 ? void 0 : d ? M(e, i) : e, p = t.length - 1, h; p >= 0; p--)
    (h = t[p]) && (s = (d ? h(e, i, s) : h(s)) || s);
  return d && s && A(e, i, s), s;
}, g = (t, e, i) => e.has(t) || m("Cannot " + i), N = (t, e, i) => (g(t, e, "read from private field"), i ? i.call(t) : e.get(t)), f = (t, e, i) => e.has(t) ? m("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, i), n = (t, e, i) => (g(t, e, "access private method"), i), a, y, _, x, b, V, C, w;
let o = class extends R {
  constructor() {
    super(), f(this, a), this._isValidating = !1, f(this, _, async () => {
      if (!this._documentId) return;
      const t = await this.getContext(v);
      if (t) {
        this._error = void 0;
        try {
          await t.validateManually(this._documentId);
        } catch (e) {
          this._error = e instanceof Error ? e.message : "Validation failed";
        }
      }
    }), this.consumeContext(T, (t) => {
      t && this.observe(
        t.unique,
        (e) => {
          this._documentId = e ?? void 0, e && n(this, a, y).call(this, e);
        }
      );
    }), this.consumeContext(v, (t) => {
      t && (this.observe(
        t.validationResult,
        (e) => {
          this._validationResult = e;
        }
      ), this.observe(
        t.isValidating,
        (e) => {
          this._isValidating = e;
        }
      ));
    });
  }
  render() {
    return r`
            <style>
                .container {
                    display: flex;
                    flex-direction: column;
                    gap: var(--uui-size-space-4);
                    padding: var(--uui-size-layout-1);
                }

                .actions {
                    display: flex;
                    align-items: center;
                    gap: var(--uui-size-space-3);
                }

                .validation-message {
                    display: flex;
                    align-items: center;
                    gap: var(--uui-size-space-3);
                    padding: var(--uui-size-space-3);
                    border-bottom: 1px solid var(--uui-color-border);
                }

                .validation-message:last-child {
                    border-bottom: none;
                }

                .message-text {
                    flex: 1;
                }

                .property-alias {
                    color: var(--uui-color-text-alt);
                    font-size: 0.9em;
                }
            </style>
            <div class="container">
                <uui-box>
                    <div slot="headline">Document Validation</div>
                    <div class="actions">
                        <uui-button
                            look="primary"
                            color="positive"
                            @click=${N(this, _)}
                            ?disabled=${!this._documentId || this._isValidating}>
                            <uui-icon name="icon-check"></uui-icon>
                            Validate Document
                        </uui-button>
                        ${this._isValidating ? r`<uui-loader></uui-loader>` : l}
                    </div>
                </uui-box>

                ${n(this, a, b).call(this)}
                ${n(this, a, V).call(this)}
                ${n(this, a, C).call(this)}
            </div>
        `;
  }
};
a = /* @__PURE__ */ new WeakSet();
y = async function(t) {
  const e = await this.getContext(v);
  e && setTimeout(async () => {
    try {
      await e.validateManually(t);
    } catch (i) {
      console.debug("Auto-validation skipped:", i);
    }
  }, 1e3);
};
_ = /* @__PURE__ */ new WeakMap();
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
b = function() {
  return this._error ? r`
            <uui-box headline="Error">
                <div style="color: var(--uui-color-danger);">
                    ${this._error}
                </div>
            </uui-box>
        ` : l;
};
V = function() {
  return this._validationResult ? this._validationResult.hasValidator ? this._validationResult.messages.length === 0 ? r`
                <uui-box headline="Validation Complete">
                    <p>No validation messages.</p>
                </uui-box>
            ` : l : r`
                <uui-box headline="No Validator Available">
                    <p>No validation configured for this content type (${this._validationResult.contentTypeAlias}).</p>
                </uui-box>
            ` : l;
};
C = function() {
  return !this._validationResult || this._validationResult.messages.length === 0 ? l : r`
            <uui-box headline="Validation Results">
                ${$(
    this._validationResult.messages,
    (t) => t.message,
    (t) => n(this, a, w).call(this, t)
  )}
            </uui-box>
        `;
};
w = function(t) {
  const e = n(this, a, x).call(this, t.severity);
  return r`
            <div class="validation-message">
                <uui-badge color=${e} look="primary">
                    ${t.severity}
                </uui-badge>
                <span class="message-text">${t.message}</span>
                ${t.propertyAlias ? r`
                    <span class="property-alias">(${t.propertyAlias})</span>
                ` : l}
            </div>
        `;
};
o.styles = [O];
u([
  c()
], o.prototype, "_documentId", 2);
u([
  c()
], o.prototype, "_validationResult", 2);
u([
  c()
], o.prototype, "_isValidating", 2);
u([
  c()
], o.prototype, "_error", 2);
o = u([
  E("my-validation-workspace-view")
], o);
export {
  o as MyValidationWorkspaceView,
  o as element
};
//# sourceMappingURL=validation-view.element-DgBk1YLW.js.map
