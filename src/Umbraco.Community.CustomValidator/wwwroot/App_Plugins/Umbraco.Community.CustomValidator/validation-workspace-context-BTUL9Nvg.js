import { UmbControllerBase as u } from "@umbraco-cms/backoffice/class-api";
import { UMB_AUTH_CONTEXT as f } from "@umbraco-cms/backoffice/auth";
import { UmbContextToken as m } from "@umbraco-cms/backoffice/context-api";
import { UmbObjectState as p } from "@umbraco-cms/backoffice/observable-api";
class g extends u {
  constructor(t) {
    super(t);
  }
  async validateDocument(t, a) {
    try {
      const s = await (await this.getContext(f))?.getLatestToken(), l = new URL(`/umbraco/management/api/v1/validation/validate/${t}`, window.location.origin);
      a && l.searchParams.append("culture", a);
      const n = await fetch(l.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${s}`,
          "Content-Type": "application/json"
        }
      });
      if (!n.ok) {
        let i = `Validation request failed: ${n.status} ${n.statusText}`;
        try {
          const o = await n.json();
          o.detail ? i = o.detail : o.title ? i = o.title : o.message && (i = o.message);
        } catch {
        }
        throw new Error(i);
      }
      return await n.json() || {
        contentId: t,
        contentTypeAlias: "",
        hasValidator: !1,
        messages: []
      };
    } catch (e) {
      throw e instanceof Error ? new Error(`Failed to validate document: ${e.message}`) : new Error("Failed to validate document: Unknown error");
    }
  }
}
var d = /* @__PURE__ */ ((r) => (r.Error = "Error", r.Warning = "Warning", r.Info = "Info", r))(d || {});
const h = new m(
  "ValidationWorkspaceContext"
);
class c extends u {
  constructor(t) {
    super(t), this.#a = new g(this), this.#t = /* @__PURE__ */ new Map(), this.#e = new p(!1), this.isValidating = this.#e.asObservable(), this.provideContext(h, this);
  }
  #a;
  #t;
  #e;
  async validateManually(t, a) {
    this.#e.setValue(!0);
    try {
      const e = await this.#a.validateDocument(t, a), s = a || "default";
      return this.#t.set(s, e), e;
    } catch (e) {
      throw console.error("Manual validation failed:", e), e;
    } finally {
      this.#e.setValue(!1);
    }
  }
  getValidationResult(t) {
    const a = t || "default";
    return this.#t.get(a);
  }
  hasBlockingErrors(t) {
    const a = t || "default", e = this.#t.get(a);
    return e ? e.messages.some((s) => s.severity === d.Error) : !1;
  }
  clearValidation() {
    this.#t.clear();
  }
}
const x = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  VALIDATION_WORKSPACE_CONTEXT: h,
  ValidationWorkspaceContext: c,
  api: c
}, Symbol.toStringTag, { value: "Module" }));
export {
  h as V,
  d as a,
  x as v
};
//# sourceMappingURL=validation-workspace-context-BTUL9Nvg.js.map
