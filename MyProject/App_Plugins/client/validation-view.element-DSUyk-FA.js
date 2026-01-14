import { nothing as v, html as a, repeat as W, state as p, customElement as M } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as P } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as A } from "@umbraco-cms/backoffice/style";
import { UMB_CONTENT_WORKSPACE_CONTEXT as N } from "@umbraco-cms/backoffice/content";
import { UMB_NOTIFICATION_CONTEXT as D } from "@umbraco-cms/backoffice/notification";
import { VALIDATION_WORKSPACE_CONTEXT as c } from "./validation-workspace-context-BRYHx8XG.js";
var U = Object.defineProperty, B = Object.getOwnPropertyDescriptor, x = (t) => {
  throw TypeError(t);
}, f = (t, i, e, n) => {
  for (var o = n > 1 ? void 0 : n ? B(i, e) : i, m = t.length - 1, g; m >= 0; m--)
    (g = t[m]) && (o = (n ? g(i, e, o) : g(o)) || o);
  return n && o && U(i, e, o), o;
}, w = (t, i, e) => i.has(t) || x("Cannot " + e), s = (t, i, e) => (w(t, i, "read from private field"), i.get(t)), h = (t, i, e) => i.has(t) ? x("Cannot add the same private member more than once") : i instanceof WeakSet ? i.add(t) : i.set(t, e), V = (t, i, e, n) => (w(t, i, "write to private field"), i.set(t, e), e), u = (t, i, e) => (w(t, i, "access private method"), e), r, _, l, I, R, b, C, k, S, $, E, T, O;
const y = /* @__PURE__ */ new Map();
let d = class extends P {
  constructor() {
    super(), h(this, l), this._isValidating = !1, h(this, r), h(this, _), h(this, b, async () => {
      if (!this._documentId) return;
      const t = await this.getContext(c);
      if (t && this._validationResult?.hasValidator !== !1)
        try {
          s(this, r)?.requestSubmit && (await s(this, r).requestSubmit(), await new Promise((i) => setTimeout(i, 500))), await t.validateManually(this._documentId, this._currentCulture);
        } catch {
        }
    }), h(this, C, async () => {
      if (!this._documentId) return;
      const t = await this.getContext(c);
      if (!t) return;
      const i = await this.getContext(D);
      if (this._validationResult?.hasValidator !== !1)
        try {
          if (s(this, r)?.requestSubmit && (await s(this, r).requestSubmit(), await new Promise((e) => setTimeout(e, 500))), await t.validateManually(this._documentId, this._currentCulture), t.hasBlockingErrors()) {
            i?.peek("danger", {
              data: {
                headline: "Cannot Publish",
                message: "Validation errors must be resolved first"
              }
            });
            return;
          }
          s(this, r) && "publish" in s(this, r) && typeof s(this, r).publish == "function" && await s(this, r).publish();
        } catch (e) {
          i?.peek("danger", {
            data: {
              headline: "Error",
              message: e instanceof Error ? e.message : "Save and publish failed"
            }
          });
        }
    }), this.consumeContext(N, (t) => {
      t && (V(this, r, t), this.observe(
        t.splitView.activeVariantsInfo,
        (i) => {
          if (i && i.length > 0) {
            const e = i[0];
            this._currentCulture = e.culture ?? void 0;
          } else
            this._currentCulture = void 0;
        }
      ), this.observe(
        t.unique,
        async (i) => {
          const e = s(this, _);
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
    this._documentId && (t ? u(this, l, R).call(this) : (y.set(this._documentId, !0), u(this, l, I).call(this)));
  }
  render() {
    return a`
            <umb-body-layout header-transparent header-fit-height>
                <div style="display: flex; flex-direction: column; gap: var(--uui-size-layout-1);">
                    ${this._validationResult?.hasValidator !== !1 && this._validationResult !== void 0 ? a`
                        <uui-box headline-variant="h4">
                            ${u(this, l, O).call(this)}
                            <uui-button-group>
                                <uui-button
                                    look="primary"
                                    color="default"
                                    label="Save & Validate"
                                    @click=${s(this, b)}
                                    ?disabled=${!this._documentId || this._isValidating}>
                                    Save & Validate
                                </uui-button>
                                <uui-button
                                    look="primary"
                                    color="positive"
                                    label="Validate & Publish"
                                    @click=${s(this, C)}
                                    ?disabled=${!this._documentId || this._isValidating}>
                                    Validate & Publish
                                </uui-button>
                                ${this._isValidating ? a`<uui-loader></uui-loader>` : v}
                            </uui-button-group>
                        </uui-box>
                    ` : v}

                    ${u(this, l, S).call(this)}
                </div>
            </umb-body-layout>
        `;
  }
};
r = /* @__PURE__ */ new WeakMap();
_ = /* @__PURE__ */ new WeakMap();
l = /* @__PURE__ */ new WeakSet();
I = async function() {
  if (!this._documentId) return;
  const t = await this.getContext(c);
  t && this._validationResult?.hasValidator !== !1 && setTimeout(async () => {
    try {
      await t.validateManually(this._documentId, this._currentCulture);
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
      await t.validateManually(this._documentId, this._currentCulture);
    } catch (i) {
      console.debug("Auto-validation on tab switch skipped:", i);
    }
};
b = /* @__PURE__ */ new WeakMap();
C = /* @__PURE__ */ new WeakMap();
k = function(t) {
  switch (t.toLowerCase()) {
    case "error":
      return "danger";
    case "warning":
      return "warning";
    default:
      return "default";
  }
};
S = function() {
  if (this._isValidating || !this._validationResult)
    return a`
                <uui-box headline="Status" headline-variant="h5">
                    <div style="display: flex; align-items: center; gap: var(--uui-size-space-3);">
                        <uui-loader></uui-loader>
                        <span>Validating...</span>
                    </div>
                </uui-box>
            `;
  if (!this._validationResult.hasValidator)
    return a`
                <uui-box headline="Status" headline-variant="h5">
                    <p>No validation configured for this content type (${this._validationResult.contentTypeAlias}).</p>
                </uui-box>
            `;
  const t = [...this._validationResult.messages].sort((e, n) => {
    const o = { Error: 0, Warning: 1, Info: 2 };
    return (o[e.severity] ?? 3) - (o[n.severity] ?? 3);
  }), i = this._validationResult.messages.some(
    (e) => e.severity === "Error" || e.severity === "Warning"
  );
  return a`
            <uui-box headline="Validation Results" headline-variant="h5">
                ${i ? v : a`
                    <p style="color: var(--uui-color-positive);">
                        <uui-icon name="icon-check"></uui-icon>
                        All validations passed successfully.
                    </p>
                `}
                <div>
                    ${W(
    t,
    (e) => e.message,
    (e) => u(this, l, $).call(this, e)
  )}
                </div>
            </uui-box>
        `;
};
$ = function(t) {
  const i = u(this, l, k).call(this, t.severity);
  return a`
            <p>
                <uui-tag color=${i} look="primary">
                    ${t.severity}
                </uui-tag>
                ${t.message}
            </p>
        `;
};
E = function() {
  return this._validationResult ? this._validationResult.messages.filter((t) => t.severity === "Error").length : 0;
};
T = function() {
  return this._validationResult ? this._validationResult.messages.filter((t) => t.severity === "Warning").length : 0;
};
O = function() {
  const t = u(this, l, E).call(this), i = u(this, l, T).call(this);
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
                ` : v}
                ${i > 0 ? a`
                    <uui-tag color="warning" look="primary">${i}</uui-tag>
                ` : v}
            </div>
        `;
};
d.styles = [A];
f([
  p()
], d.prototype, "_documentId", 2);
f([
  p()
], d.prototype, "_validationResult", 2);
f([
  p()
], d.prototype, "_isValidating", 2);
f([
  p()
], d.prototype, "_currentCulture", 2);
d = f([
  M("my-validation-workspace-view")
], d);
export {
  d as MyValidationWorkspaceView,
  d as element
};
//# sourceMappingURL=validation-view.element-DSUyk-FA.js.map
