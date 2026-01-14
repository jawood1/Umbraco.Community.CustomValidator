import { UmbControllerBase as s } from "@umbraco-cms/backoffice/class-api";
import { UMB_AUTH_CONTEXT as n } from "@umbraco-cms/backoffice/auth";
import { UmbContextToken as l } from "@umbraco-cms/backoffice/context-api";
import { UmbObjectState as i } from "@umbraco-cms/backoffice/observable-api";
class u extends s {
  constructor(t) {
    super(t);
  }
  async validateDocument(t) {
    const r = await (await this.getContext(n))?.getLatestToken(), a = await fetch(`/umbraco/management/api/v1/validation/validate/${t}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${r}`,
        "Content-Type": "application/json"
      }
    });
    if (!a.ok)
      throw new Error(`Validation request failed: ${a.statusText}`);
    return await a.json();
  }
}
const c = new l(
  "ValidationWorkspaceContext"
);
class v extends s {
  constructor(t) {
    super(t), this.#a = new u(this), this.#t = new i(void 0), this.#e = new i(!1), this.validationResult = this.#t.asObservable(), this.isValidating = this.#e.asObservable(), this.provideContext(c, this);
  }
  #a;
  #t;
  #e;
  async validateManually(t) {
    this.#e.setValue(!0);
    try {
      const e = await this.#a.validateDocument(t);
      return this.#t.setValue(e), e;
    } catch (e) {
      throw console.error("Manual validation failed:", e), e;
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
  c as VALIDATION_WORKSPACE_CONTEXT,
  v as ValidationWorkspaceContext,
  v as api
};
//# sourceMappingURL=validation-workspace-context-Dzg7J8I0.js.map
