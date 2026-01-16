import { UmbControllerBase as f } from "@umbraco-cms/backoffice/class-api";
import { UMB_AUTH_CONTEXT as m } from "@umbraco-cms/backoffice/auth";
import { UmbContextToken as p } from "@umbraco-cms/backoffice/context-api";
import { UmbObjectState as g } from "@umbraco-cms/backoffice/observable-api";
var c = /* @__PURE__ */ ((o) => (o.Error = "Error", o.Warning = "Warning", o.Info = "Info", o))(c || {});
class v extends f {
  constructor(t) {
    super(t);
  }
  /**
   * Always use the POST endpoint for both single and multi-culture validation.
   */
  async validateDocumentMultipleCultures(t, e) {
    try {
      const a = await (await this.getContext(m))?.getLatestToken(), n = new URL(`/umbraco/management/api/v1/validation/validate/${t}`, window.location.origin), r = await fetch(n.toString(), {
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
          const i = await r.json();
          i.detail ? l = i.detail : i.title ? l = i.title : i.message && (l = i.message);
        } catch {
        }
        throw new Error(l);
      }
      return await r.json() || {};
    } catch (s) {
      const a = {};
      for (const n of e)
        a[n || "default"] = {
          contentId: t,
          contentTypeAlias: "",
          hasValidator: !1,
          messages: [{ message: `Validation failed: ${s.message}`, severity: c.Error }]
        };
      return a;
    }
  }
  // For compatibility with context, provide a single-culture method that calls the multi-culture one
  async validateDocument(t, e) {
    return (await this.validateDocumentMultipleCultures(t, [e]))[e || "default"];
  }
  // (Removed duplicate implementation)
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
      const a = s && s.length > 0 ? s : [e], n = await this.#a.validateDocumentMultipleCultures(t, a);
      for (const [r, u] of Object.entries(n))
        this.#t.set(r, u);
      return n;
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
const T = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  VALIDATION_WORKSPACE_CONTEXT: h,
  ValidationWorkspaceContext: d,
  api: d
}, Symbol.toStringTag, { value: "Module" }));
export {
  h as V,
  c as a,
  T as v
};
//# sourceMappingURL=validation-workspace-context-DaTwn9M5.js.map
