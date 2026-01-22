import { UmbControllerBase as c, UmbContextBase as l } from "@umbraco-cms/backoffice/class-api";
import { UMB_AUTH_CONTEXT as u } from "@umbraco-cms/backoffice/auth";
import { UmbContextToken as h } from "@umbraco-cms/backoffice/context-api";
import { UmbObjectState as m, UmbNumberState as d } from "@umbraco-cms/backoffice/observable-api";
class w extends c {
  constructor(t) {
    super(t), this.baseUrl = `${window.location.origin}/umbraco/management/api/v1/validation`;
  }
  async validateDocument(t, a) {
    try {
      const s = await (await this.getContext(u))?.getLatestToken();
      if (!s)
        throw new Error("Authentication token not available");
      const n = new URL(`${this.baseUrl}/validate/${encodeURIComponent(t)}`);
      a && n.searchParams.append("culture", a);
      const r = await fetch(n, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${s}`,
          "Content-Type": "application/json"
        }
      });
      if (!r.ok) {
        const i = await this.extractErrorMessage(r);
        throw new Error(i);
      }
      return await r.json() || {};
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : String(e));
    }
  }
  async extractErrorMessage(t) {
    const a = `Validation request failed: ${t.status} ${t.statusText}`;
    try {
      const e = await t.json();
      return e.detail || e.title || e.message || a;
    } catch {
      return a;
    }
  }
}
class v extends l {
  constructor(t) {
    super(t, p), this.#a = new w(this), this.#e = new m(!1), this.#t = new d(0), this.instanceCounter = this.#t.asObservable(), this.isValidating = this.#e.asObservable();
  }
  #a;
  #e;
  #t;
  incrementInstance() {
    this.#t.setValue(this.#t.value + 1);
  }
  resetInstanceCounter() {
    this.#t.setValue(0);
  }
  async validateManually(t, a) {
    this.#e.setValue(!0);
    try {
      return await this.#a.validateDocument(t, a);
    } catch (e) {
      throw console.error("Manual validation failed:", e), e;
    } finally {
      this.#e.setValue(!1);
    }
  }
}
const p = new h(
  "UmbWorkspaceContext",
  "ValidationWorkspaceContext"
);
export {
  p as VALIDATION_WORKSPACE_CONTEXT,
  v as ValidationWorkspaceContext,
  v as api
};
//# sourceMappingURL=validation-workspace-context-C5LC-9vh.js.map
