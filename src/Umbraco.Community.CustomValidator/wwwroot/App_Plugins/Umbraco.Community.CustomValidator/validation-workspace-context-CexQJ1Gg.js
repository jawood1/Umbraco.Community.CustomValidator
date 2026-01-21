import { UmbControllerBase as d, UmbContextBase as f } from "@umbraco-cms/backoffice/class-api";
import { UMB_AUTH_CONTEXT as m } from "@umbraco-cms/backoffice/auth";
import { UmbContextToken as g } from "@umbraco-cms/backoffice/context-api";
import { UmbObjectState as b, UmbNumberState as p } from "@umbraco-cms/backoffice/observable-api";
var l = /* @__PURE__ */ ((n) => (n.Error = "Error", n.Warning = "Warning", n.Info = "Info", n))(l || {});
class v extends d {
  constructor(t) {
    super(t), this.baseUrl = `${window.location.origin}/umbraco/management/api/v1/validation`;
  }
  /**
   * Validates a document across multiple cultures
   * @param id - Document identifier
   * @param cultures - Array of culture codes to validate (undefined for invariant culture)
   * @returns Validation results keyed by culture code
   */
  async validateDocumentMultipleCultures(t, a) {
    try {
      const r = await (await this.getContext(m))?.getLatestToken();
      if (!r)
        throw new Error("Authentication token not available");
      const s = `${this.baseUrl}/validate/${encodeURIComponent(t)}`, o = await fetch(s, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${r}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ cultures: a })
      });
      if (!o.ok) {
        const h = await this.extractErrorMessage(o);
        throw new Error(h);
      }
      return await o.json() || {};
    } catch (e) {
      return this.createFallbackResults(t, a, e);
    }
  }
  /**
   * Validates a document for a single culture
   * @param id - Document identifier
   * @param culture - Culture code (undefined for invariant culture)
   * @returns Validation result for the specified culture
   */
  async validateDocument(t, a) {
    return (await this.validateDocumentMultipleCultures(t, [a]))[a || "default"];
  }
  /**
   * Extracts error message from failed response
   */
  async extractErrorMessage(t) {
    const a = `Validation request failed: ${t.status} ${t.statusText}`;
    try {
      const e = await t.json();
      return e.detail || e.title || e.message || a;
    } catch {
      return a;
    }
  }
  /**
   * Creates fallback validation results when validation fails
   */
  createFallbackResults(t, a, e) {
    const r = e instanceof Error ? e.message : "Unknown validation error", s = {};
    for (const o of a) {
      const i = o || "default";
      s[i] = {
        contentId: t,
        hasValidator: !1,
        messages: [{
          message: `Validation failed: ${r}`,
          severity: l.Error
        }]
      };
    }
    return s;
  }
}
class c extends f {
  constructor(t) {
    super(t, u), this.#r = new v(this), this.#t = /* @__PURE__ */ new Map(), this.#a = new b(!1), this.#e = new p(0), this.counter = this.#e.asObservable(), this.isValidating = this.#a.asObservable();
  }
  #r;
  #t;
  #a;
  #e;
  increment() {
    this.#e.setValue(this.#e.value + 1);
  }
  reset() {
    this.#e.setValue(0);
  }
  /**
   * Always use the multi-culture POST endpoint. If allCultures is omitted, validates current (single) culture.
   * Results are stored per culture.
   */
  async validateManually(t, a, e) {
    this.#a.setValue(!0);
    try {
      const r = e && e.length > 0 ? e : [a], s = await this.#r.validateDocumentMultipleCultures(t, r);
      for (const [o, i] of Object.entries(s))
        this.#t.set(o, i);
      return s;
    } catch (r) {
      throw console.error("Manual validation failed:", r), r;
    } finally {
      this.#a.setValue(!1);
    }
  }
  getValidationResult(t) {
    const a = t || "default";
    return this.#t.get(a);
  }
  hasBlockingErrors(t) {
    const a = t || "default", e = this.#t.get(a);
    return e ? e.messages.some((r) => r.severity === l.Error) : !1;
  }
  clearValidation() {
    this.#t.clear();
  }
}
const u = new g(
  "UmbWorkspaceContext",
  "ValidationWorkspaceContext"
), k = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  VALIDATION_WORKSPACE_CONTEXT: u,
  ValidationWorkspaceContext: c,
  api: c
}, Symbol.toStringTag, { value: "Module" }));
export {
  u as V,
  l as a,
  k as v
};
//# sourceMappingURL=validation-workspace-context-CexQJ1Gg.js.map
