import { UmbControllerBase as r } from "@umbraco-cms/backoffice/class-api";
import { UMB_AUTH_CONTEXT as c } from "@umbraco-cms/backoffice/auth";
import { UmbContextToken as u } from "@umbraco-cms/backoffice/context-api";
import { UmbObjectState as o } from "@umbraco-cms/backoffice/observable-api";
class h extends r {
  constructor(t) {
    super(t);
  }
  async validateDocument(t, e) {
    const l = await (await this.getContext(c))?.getLatestToken(), s = new URL(`/umbraco/management/api/v1/validation/validate/${t}`, window.location.origin);
    e && s.searchParams.append("culture", e);
    const i = await fetch(s.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${l}`,
        "Content-Type": "application/json"
      }
    });
    if (!i.ok)
      throw new Error(`Validation request failed: ${i.statusText}`);
    return await i.json();
  }
}
const d = new u(
  "ValidationWorkspaceContext"
);
class V extends r {
  constructor(t) {
    super(t), this.#a = new h(this), this.#t = new o(void 0), this.#e = new o(!1), this.validationResult = this.#t.asObservable(), this.isValidating = this.#e.asObservable(), this.provideContext(d, this);
  }
  #a;
  #t;
  #e;
  async validateManually(t, e) {
    this.#e.setValue(!0);
    try {
      const a = await this.#a.validateDocument(t, e);
      return this.#t.setValue(a), a;
    } catch (a) {
      throw console.error("Manual validation failed:", a), a;
    } finally {
      this.#e.setValue(!1);
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
    this.#t.setValue(void 0);
  }
}
export {
  d as VALIDATION_WORKSPACE_CONTEXT,
  V as ValidationWorkspaceContext,
  V as api
};
//# sourceMappingURL=validation-workspace-context-BRYHx8XG.js.map
