import { UmbControllerBase as r } from "@umbraco-cms/backoffice/class-api";
import { UMB_AUTH_CONTEXT as c } from "@umbraco-cms/backoffice/auth";
import { UmbContextToken as h } from "@umbraco-cms/backoffice/context-api";
import { UmbObjectState as n } from "@umbraco-cms/backoffice/observable-api";
class u extends r {
  constructor(t) {
    super(t);
  }
  async validateDocument(t, e) {
    const s = await (await this.getContext(c))?.getLatestToken(), o = new URL(`/umbraco/management/api/v1/validation/validate/${t}`, window.location.origin);
    e && o.searchParams.append("culture", e);
    const i = await fetch(o.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${s}`,
        "Content-Type": "application/json"
      }
    });
    if (!i.ok)
      throw new Error(`Validation request failed: ${i.statusText}`);
    return await i.json();
  }
}
const d = new h(
  "ValidationWorkspaceContext"
);
class w extends r {
  constructor(t) {
    super(t), this.#i = new u(this), this.#e = /* @__PURE__ */ new Map(), this.#t = new n(void 0), this.#a = new n(!1), this.validationResult = this.#t.asObservable(), this.isValidating = this.#a.asObservable(), this.provideContext(d, this);
  }
  #i;
  #e;
  #t;
  #a;
  #s;
  setActiveCulture(t) {
    this.#s = t;
    const e = t || "default", a = this.#e.get(e);
    this.#t.setValue(a);
  }
  async validateManually(t, e) {
    this.#a.setValue(!0);
    try {
      const a = await this.#i.validateDocument(t, e), s = e || "default";
      return this.#e.set(s, a), (e === this.#s || !e && !this.#s) && this.#t.setValue(a), a;
    } catch (a) {
      throw console.error("Manual validation failed:", a), a;
    } finally {
      this.#a.setValue(!1);
    }
  }
  getLastValidationResult() {
    return this.#t.getValue();
  }
  hasBlockingErrors() {
    const t = this.#t.getValue();
    return t ? t.messages.some((e) => e.severity === "Error") : !1;
  }
  clearValidation() {
    this.#e.clear(), this.#t.setValue(void 0);
  }
}
export {
  d as VALIDATION_WORKSPACE_CONTEXT,
  w as ValidationWorkspaceContext,
  w as api
};
//# sourceMappingURL=validation-workspace-context-BRYjoVER.js.map
