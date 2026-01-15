import { UmbControllerBase as l } from "@umbraco-cms/backoffice/class-api";
import { UMB_AUTH_CONTEXT as d } from "@umbraco-cms/backoffice/auth";
import { UmbContextToken as h } from "@umbraco-cms/backoffice/context-api";
import { UmbObjectState as p } from "@umbraco-cms/backoffice/observable-api";
class f extends l {
  constructor(t) {
    super(t);
  }
  async validateDocument(t, e) {
    const o = await (await this.getContext(d))?.getLatestToken(), n = new URL(`/umbraco/management/api/v1/validation/validate/${t}`, window.location.origin);
    e && n.searchParams.append("culture", e);
    const s = await fetch(n.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${o}`,
        "Content-Type": "application/json"
      }
    });
    if (!s.ok)
      throw new Error(`Validation request failed: ${s.statusText}`);
    return await s.json();
  }
}
var c = /* @__PURE__ */ ((r) => (r.Error = "Error", r.Warning = "Warning", r.Info = "Info", r))(c || {});
const u = new h(
  "ValidationWorkspaceContext"
);
class i extends l {
  constructor(t) {
    super(t), this.#a = new f(this), this.#t = /* @__PURE__ */ new Map(), this.#e = new p(!1), this.isValidating = this.#e.asObservable(), this.provideContext(u, this);
  }
  #a;
  #t;
  #e;
  async validateManually(t, e) {
    this.#e.setValue(!0);
    try {
      const a = await this.#a.validateDocument(t, e), o = e || "default";
      return this.#t.set(o, a), a;
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
    return a ? a.messages.some((o) => o.severity === c.Error) : !1;
  }
  clearValidation() {
    this.#t.clear();
  }
}
const C = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  VALIDATION_WORKSPACE_CONTEXT: u,
  ValidationWorkspaceContext: i,
  api: i
}, Symbol.toStringTag, { value: "Module" }));
export {
  u as V,
  c as a,
  C as v
};
//# sourceMappingURL=validation-workspace-context-Ci2i-Dis.js.map
