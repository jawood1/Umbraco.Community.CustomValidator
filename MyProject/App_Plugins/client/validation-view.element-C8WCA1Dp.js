import { html as r, nothing as u, state as c, customElement as E, repeat as T } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as R } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as k } from "@umbraco-cms/backoffice/style";
import { UMB_CONTENT_WORKSPACE_CONTEXT as A } from "@umbraco-cms/backoffice/content";
import { UmbControllerBase as L } from "@umbraco-cms/backoffice/class-api";
import { UMB_AUTH_CONTEXT as M } from "@umbraco-cms/backoffice/auth";
class O extends L {
  constructor(t) {
    super(t);
  }
  async validateDocument(t) {
    const n = await (await this.getContext(M))?.getLatestToken(), a = await fetch(`/umbraco/management/api/v1/validation/validate/${t}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${n}`,
        "Content-Type": "application/json"
      }
    });
    if (!a.ok)
      throw new Error(`Validation request failed: ${a.statusText}`);
    return await a.json();
  }
}
var S = Object.defineProperty, z = Object.getOwnPropertyDescriptor, m = (e) => {
  throw TypeError(e);
}, d = (e, t, i, n) => {
  for (var a = n > 1 ? void 0 : n ? z(t, i) : t, p = e.length - 1, h; p >= 0; p--)
    (h = e[p]) && (a = (n ? h(t, i, a) : h(a)) || a);
  return n && a && S(t, i, a), a;
}, g = (e, t, i) => t.has(e) || m("Cannot " + i), y = (e, t, i) => (g(e, t, "read from private field"), i ? i.call(e) : t.get(e)), v = (e, t, i) => t.has(e) ? m("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, i), l = (e, t, i) => (g(e, t, "access private method"), i), _, f, s, x, w, C, b, $, V;
let o = class extends R {
  constructor() {
    super(), v(this, s), v(this, _, new O(this)), this._isLoading = !1, v(this, f, async () => {
      if (this._documentId) {
        this._isLoading = !0, this._error = void 0;
        try {
          this._validationResult = await y(this, _).validateDocument(this._documentId);
        } catch (e) {
          this._error = e instanceof Error ? e.message : "Validation failed";
        } finally {
          this._isLoading = !1;
        }
      }
    }), this.consumeContext(A, (e) => {
      e && this.observe(
        e.unique,
        (t) => {
          this._documentId = t ?? void 0;
        }
      );
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
            <div class="container">${l(this, s, V).call(this)}</div>
        `;
  }
};
_ = /* @__PURE__ */ new WeakMap();
f = /* @__PURE__ */ new WeakMap();
s = /* @__PURE__ */ new WeakSet();
x = function(e) {
  switch (e.toLowerCase()) {
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
w = function() {
  return this._error ? r`
            <uui-box headline="Error">
                <div style="color: var(--uui-color-danger);">
                    ${this._error}
                </div>
            </uui-box>
        ` : u;
};
C = function() {
  return this._validationResult ? this._validationResult.hasValidator ? this._validationResult.messages.length === 0 ? r`
                <uui-box headline="Validation Complete">
                    <p>No validation messages.</p>
                </uui-box>
            ` : u : r`
                <uui-box headline="No Validator Available">
                    <p>No validation configured for this content type (${this._validationResult.contentTypeAlias}).</p>
                </uui-box>
            ` : u;
};
b = function() {
  return !this._validationResult || this._validationResult.messages.length === 0 ? u : r`
            <uui-box headline="Validation Results">
                ${T(
    this._validationResult.messages,
    (e) => e.message,
    (e) => l(this, s, $).call(this, e)
  )}
            </uui-box>
        `;
};
$ = function(e) {
  const t = l(this, s, x).call(this, e.severity);
  return r`
            <div class="validation-message">
                <uui-badge color=${t} look="primary">
                    ${e.severity}
                </uui-badge>
                <span class="message-text">${e.message}</span>
                ${e.propertyAlias ? r`
                    <span class="property-alias">(${e.propertyAlias})</span>
                ` : u}
            </div>
        `;
};
V = function() {
  return r`
            <div class="container">
                <uui-box>
                    <div slot="headline">Document Validation</div>
                    <div class="actions">
                        <uui-button
                            look="primary"
                            color="positive"
                            @click=${y(this, f)}
                            ?disabled=${!this._documentId || this._isLoading}>
                            <uui-icon name="icon-check"></uui-icon>
                            Validate Document
                        </uui-button>
                        ${this._isLoading ? r`<uui-loader></uui-loader>` : u}
                    </div>
                </uui-box>

                ${l(this, s, w).call(this)}
                ${l(this, s, C).call(this)}
                ${l(this, s, b).call(this)}
            </div>
        `;
};
o.styles = [k];
d([
  c()
], o.prototype, "_documentId", 2);
d([
  c()
], o.prototype, "_validationResult", 2);
d([
  c()
], o.prototype, "_isLoading", 2);
d([
  c()
], o.prototype, "_error", 2);
o = d([
  E("my-validation-workspace-view")
], o);
export {
  o as MyValidationWorkspaceView,
  o as element
};
//# sourceMappingURL=validation-view.element-C8WCA1Dp.js.map
