import { UmbControllerBase as f } from "@umbraco-cms/backoffice/class-api";
import { UMB_AUTH_CONTEXT as m } from "@umbraco-cms/backoffice/auth";
import { UmbContextToken as p } from "@umbraco-cms/backoffice/context-api";
import { UmbObjectState as g } from "@umbraco-cms/backoffice/observable-api";
var c = /* @__PURE__ */ ((o) => (o.Error = "Error", o.Warning = "Warning", o.Info = "Info", o))(c || {});
class v extends f {
  constructor(t) {
    super(t);
  }
  async validateDocumentMultipleCultures(t, e) {
    try {
      const a = await (await this.getContext(m))?.getLatestToken(), i = new URL(`/umbraco/management/api/v1/validation/validate/${t}`, window.location.origin), r = await fetch(i.toString(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${a}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ cultures: e })
      });
      if (!r.ok) {
        let l = `Validation request failed: ${r.status} ${r.statusText}`;
        try {
          const n = await r.json();
          n.detail ? l = n.detail : n.title ? l = n.title : n.message && (l = n.message);
        } catch {
        }
        throw new Error(l);
      }
      return await r.json() || {};
    } catch (s) {
      const a = {};
      for (const i of e)
        a[i || "default"] = {
          contentId: t,
          hasValidator: !1,
          messages: [{ message: `Validation failed: ${s.message}`, severity: c.Error }]
        };
      return a;
    }
  }
  async validateDocument(t, e) {
    return (await this.validateDocumentMultipleCultures(t, [e]))[e || "default"];
  }
}
const h = new p(
  "ValidationWorkspaceContext"
);
class d extends f {
  constructor(t) {
    super(t), this.#a = new v(this), this.#t = /* @__PURE__ */ new Map(), this.#e = new g(!1), this.isValidating = this.#e.asObservable(), this.provideContext(h, this);
  }
  #a;
  #t;
  #e;
  /**
   * Always use the multi-culture POST endpoint. If allCultures is omitted, validates current (single) culture.
   * Results are stored per culture.
   */
  async validateManually(t, e, s) {
    this.#e.setValue(!0);
    try {
      const a = s && s.length > 0 ? s : [e], i = await this.#a.validateDocumentMultipleCultures(t, a);
      for (const [r, u] of Object.entries(i))
        this.#t.set(r, u);
      return i;
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
  hasBlockingErrors(t) {
    const e = t || "default", s = this.#t.get(e);
    return s ? s.messages.some((a) => a.severity === c.Error) : !1;
  }
  clearValidation() {
    this.#t.clear();
  }
}
const x = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  VALIDATION_WORKSPACE_CONTEXT: h,
  ValidationWorkspaceContext: d,
  api: d
}, Symbol.toStringTag, { value: "Module" }));
export {
  h as V,
  c as a,
  x as v
};
//# sourceMappingURL=validation-workspace-context-C1nOTYt_.js.map
