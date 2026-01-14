import { UmbControllerBase as n } from "@umbraco-cms/backoffice/class-api";
import { UMB_CONTENT_WORKSPACE_CONTEXT as i } from "@umbraco-cms/backoffice/content";
import { UmbVariantId as r } from "@umbraco-cms/backoffice/variant";
class p extends n {
  constructor(o) {
    super(o), console.log("NameManipulationWorkspaceContext: Constructor called"), this.consumeContext(i, async (t) => {
      if (console.log("NameManipulationWorkspaceContext: Workspace context consumed", t), !t) return;
      await t.isLoaded();
      const e = r.CreateInvariant();
      if (t.getName(e) === void 0) {
        const a = `New Document - ${(/* @__PURE__ */ new Date()).toLocaleDateString(
          "en-US"
        )}`;
        t.setName(a, e);
      }
    });
  }
}
export {
  p as NameManipulationWorkspaceContext,
  p as api
};
//# sourceMappingURL=workspace-context-DBTuSfbJ.js.map
