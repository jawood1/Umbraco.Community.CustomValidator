import { UmbControllerBase as r } from "@umbraco-cms/backoffice/class-api";
import { UMB_AUTH_CONTEXT as l } from "@umbraco-cms/backoffice/auth";
import { UmbContextToken as c } from "@umbraco-cms/backoffice/context-api";
import { UmbObjectState as u } from "@umbraco-cms/backoffice/observable-api";
class d extends r {
  constructor(t) {
    super(t);
  }
  async validateDocument(t, e) {
    const i = await (await this.getContext(l))?.getLatestToken(), o = new URL(`/umbraco/management/api/v1/validation/validate/${t}`, window.location.origin);
    e && o.searchParams.append("culture", e);
    const s = await fetch(o.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${i}`,
        "Content-Type": "application/json"
      }
    });
    if (!s.ok)
      throw new Error(`Validation request failed: ${s.statusText}`);
    return await s.json();
  }
}
const h = new c(
  "ValidationWorkspaceContext"
);
class v extends r {
  constructor(t) {
    super(t), this.#a = new d(this), this.#t = /* @__PURE__ */ new Map(), this.#e = new u(!1), this.isValidating = this.#e.asObservable(), this.provideContext(h, this);
  }
  #a;
  #t;
  #e;
  async validateManually(t, e) {
    this.#e.setValue(!0);
    try {
      const a = await this.#a.validateDocument(t, e), i = e || "default";
      return this.#t.set(i, a), a;
    } catch (a) {
      throw console.error("Manual validation failed:", a), a;
    } finally {
      this.#e.setValue(!1);
    }
  }
  getValidationResult(t) {
    const e = t || "default";
    return this.#t.get(e);
  }
  getLastValidationResult() {
    return Array.from(this.#t.values())[0];
  }
  hasBlockingErrors(t) {
    const e = t || "default", a = this.#t.get(e);
    return a ? a.messages.some((i) => i.severity === "Error") : !1;
  }
  clearValidation() {
    this.#t.clear();
  }
}
export {
  h as VALIDATION_WORKSPACE_CONTEXT,
  v as ValidationWorkspaceContext,
  v as api
};
//# sourceMappingURL=validation-workspace-context-JF3_5EKq.js.map
