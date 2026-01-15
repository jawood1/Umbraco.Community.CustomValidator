import { nothing as _, html as n, repeat as P, state as m, customElement as A } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as N } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as D } from "@umbraco-cms/backoffice/style";
import { UMB_CONTENT_WORKSPACE_CONTEXT as U } from "@umbraco-cms/backoffice/content";
import { UMB_NOTIFICATION_CONTEXT as B } from "@umbraco-cms/backoffice/notification";
import { VALIDATION_WORKSPACE_CONTEXT as d } from "./validation-workspace-context-JF3_5EKq.js";
var L = Object.defineProperty, X = Object.getOwnPropertyDescriptor, I = (t) => {
  throw TypeError(t);
}, f = (t, i, e, r) => {
  for (var a = r > 1 ? void 0 : r ? X(i, e) : i, c = t.length - 1, y; c >= 0; c--)
    (y = t[c]) && (a = (r ? y(i, e, a) : y(a)) || a);
  return r && a && L(i, e, a), a;
}, R = (t, i, e) => i.has(t) || I("Cannot " + e), s = (t, i, e) => (R(t, i, "read from private field"), i.get(t)), v = (t, i, e) => i.has(t) ? I("Cannot add the same private member more than once") : i instanceof WeakSet ? i.add(t) : i.set(t, e), C = (t, i, e, r) => (R(t, i, "write to private field"), i.set(t, e), e), l = (t, i, e) => (R(t, i, "access private method"), e), p, o, g, u, k, S, V, x, T, $, E, M, W, O;
const b = /* @__PURE__ */ new Map();
let w = 0, h = class extends N {
  constructor() {
    super(), v(this, u), v(this, p), this._isValidating = !1, v(this, o), v(this, g), v(this, V, async () => {
      if (!this._documentId) return;
      const t = await this.getContext(d);
      if (t && this._validationResult?.hasValidator !== !1)
        try {
          s(this, o)?.requestSubmit && (await s(this, o).requestSubmit(), await new Promise((i) => setTimeout(i, 500))), await t.validateManually(this._documentId, this._currentCulture), this._validationResult = t.getValidationResult(this._currentCulture);
        } catch {
        }
    }), v(this, x, async () => {
      if (!this._documentId) return;
      const t = await this.getContext(d);
      if (!t) return;
      const i = await this.getContext(B);
      if (this._validationResult?.hasValidator !== !1)
        try {
          if (s(this, o)?.requestSubmit && (await s(this, o).requestSubmit(), await new Promise((e) => setTimeout(e, 500))), await t.validateManually(this._documentId, this._currentCulture), this._validationResult = t.getValidationResult(this._currentCulture), t.hasBlockingErrors(this._currentCulture)) {
            i?.peek("danger", {
              data: {
                headline: "Cannot Publish",
                message: "Validation errors must be resolved first"
              }
            });
            return;
          }
          s(this, o) && "publish" in s(this, o) && typeof s(this, o).publish == "function" && await s(this, o).publish();
        } catch (e) {
          i?.peek("danger", {
            data: {
              headline: "Error",
              message: e instanceof Error ? e.message : "Save and publish failed"
            }
          });
        }
    }), C(this, p, w++), setTimeout(() => {
      w > 1 && (w = 0);
    }, 2e3), this.consumeContext(U, (t) => {
      t && (C(this, o, t), this.observe(
        t.splitView.activeVariantsInfo,
        async (i) => {
          if (i && i.length > 0) {
            const e = i.length > 1 ? Math.min(s(this, p), i.length - 1) : 0, a = i[e]?.culture ?? void 0;
            if (this._currentCulture !== a) {
              this._currentCulture = a;
              const c = await this.getContext(d);
              c && (this._validationResult = c.getValidationResult(this._currentCulture));
            }
          } else
            this._currentCulture = void 0;
        }
      ), this.observe(
        t.unique,
        async (i) => {
          const e = s(this, g);
          this._documentId = i ?? void 0, C(this, g, i ?? void 0);
          const r = await this.getContext(d);
          r && r.clearValidation(), e !== void 0 && e !== i && i && b.delete(i);
        }
      ));
    }), this.consumeContext(d, (t) => {
      t && this.observe(
        t.isValidating,
        (i) => {
          this._isValidating = i;
        }
      );
    });
  }
  connectedCallback() {
    super.connectedCallback();
    const t = this._documentId ? b.get(this._documentId) ?? !1 : !1;
    this._documentId && (t ? l(this, u, S).call(this) : (b.set(this._documentId, !0), l(this, u, k).call(this)));
  }
  render() {
    return n`
            <umb-body-layout header-transparent header-fit-height>
                <div style="display: flex; flex-direction: column; gap: var(--uui-size-layout-1);">
                    ${this._validationResult?.hasValidator !== !1 && this._validationResult !== void 0 ? n`
                        <uui-box headline-variant="h4">
                            ${l(this, u, O).call(this)}
                            <uui-button-group>
                                <uui-button
                                    look="primary"
                                    color="default"
                                    label="Save & Validate"
                                    @click=${s(this, V)}
                                    ?disabled=${!this._documentId || this._isValidating}>
                                    Save & Validate
                                </uui-button>
                                <uui-button
                                    look="primary"
                                    color="positive"
                                    label="Validate & Publish"
                                    @click=${s(this, x)}
                                    ?disabled=${!this._documentId || this._isValidating}>
                                    Validate & Publish
                                </uui-button>
                                ${this._isValidating ? n`<uui-loader></uui-loader>` : _}
                            </uui-button-group>
                        </uui-box>
                    ` : _}

                    ${l(this, u, $).call(this)}
                </div>
            </umb-body-layout>
        `;
  }
};
p = /* @__PURE__ */ new WeakMap();
o = /* @__PURE__ */ new WeakMap();
g = /* @__PURE__ */ new WeakMap();
u = /* @__PURE__ */ new WeakSet();
k = async function() {
  if (!this._documentId) return;
  const t = await this.getContext(d);
  t && this._validationResult?.hasValidator !== !1 && setTimeout(async () => {
    try {
      await t.validateManually(this._documentId, this._currentCulture), this._validationResult = t.getValidationResult(this._currentCulture);
    } catch (i) {
      console.debug("Validation skipped:", i);
    }
  }, 1e3);
};
S = async function() {
  if (!this._documentId) return;
  const t = await this.getContext(d);
  if (t && this._validationResult?.hasValidator !== !1)
    try {
      await t.validateManually(this._documentId, this._currentCulture), this._validationResult = t.getValidationResult(this._currentCulture);
    } catch (i) {
      console.debug("Auto-validation on tab switch skipped:", i);
    }
};
V = /* @__PURE__ */ new WeakMap();
x = /* @__PURE__ */ new WeakMap();
T = function(t) {
  switch (t.toLowerCase()) {
    case "error":
      return "danger";
    case "warning":
      return "warning";
    default:
      return "default";
  }
};
$ = function() {
  if (this._isValidating || !this._validationResult)
    return n`
                <uui-box headline="Status" headline-variant="h5">
                    <div style="display: flex; align-items: center; gap: var(--uui-size-space-3);">
                        <uui-loader></uui-loader>
                        <span>Validating...</span>
                    </div>
                </uui-box>
            `;
  if (!this._validationResult.hasValidator)
    return n`
                <uui-box headline="Status" headline-variant="h5">
                    <p>No validation configured for this content type (${this._validationResult.contentTypeAlias}).</p>
                </uui-box>
            `;
  const t = [...this._validationResult.messages].sort((e, r) => {
    const a = { Error: 0, Warning: 1, Info: 2 };
    return (a[e.severity] ?? 3) - (a[r.severity] ?? 3);
  }), i = this._validationResult.messages.some(
    (e) => e.severity === "Error" || e.severity === "Warning"
  );
  return n`
            <uui-box headline="Validation Results" headline-variant="h5">
                ${i ? _ : n`
                    <p style="color: var(--uui-color-positive);">
                        <uui-icon name="icon-check"></uui-icon>
                        All validations passed successfully.
                    </p>
                `}
                <div>
                    ${P(
    t,
    (e) => e.message,
    (e) => l(this, u, E).call(this, e)
  )}
                </div>
            </uui-box>
        `;
};
E = function(t) {
  const i = l(this, u, T).call(this, t.severity);
  return n`
            <p>
                <uui-tag color=${i} look="primary">
                    ${t.severity}
                </uui-tag>
                ${t.message}
            </p>
        `;
};
M = function() {
  return this._validationResult ? this._validationResult.messages.filter((t) => t.severity === "Error").length : 0;
};
W = function() {
  return this._validationResult ? this._validationResult.messages.filter((t) => t.severity === "Warning").length : 0;
};
O = function() {
  const t = l(this, u, M).call(this), i = l(this, u, W).call(this);
  return n`
            <div slot="headline">
                ${t > 0 ? n`
                    <uui-icon name="icon-delete" style="color: var(--uui-color-danger);"></uui-icon>
                ` : n`
                    <uui-icon name="icon-check" style="color: var(--uui-color-positive);"></uui-icon>
                `}
                Document Validation
            </div>
            <div slot="header-actions">
                ${t > 0 ? n`
                    <uui-tag color="danger" look="primary">${t}</uui-tag>
                ` : _}
                ${i > 0 ? n`
                    <uui-tag color="warning" look="primary">${i}</uui-tag>
                ` : _}
            </div>
        `;
};
h.styles = [D];
f([
  m()
], h.prototype, "_documentId", 2);
f([
  m()
], h.prototype, "_validationResult", 2);
f([
  m()
], h.prototype, "_isValidating", 2);
f([
  m()
], h.prototype, "_currentCulture", 2);
h = f([
  A("my-validation-workspace-view")
], h);
export {
  h as MyValidationWorkspaceView,
  h as element
};
//# sourceMappingURL=validation-view.element-CeoUTylu.js.map
