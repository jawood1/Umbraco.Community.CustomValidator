import { UMB_WORKSPACE_CONDITION_ALIAS as a, UMB_WORKSPACE_ENTITY_IS_NEW_CONDITION_ALIAS as i } from "@umbraco-cms/backoffice/workspace";
import { umbExtensionsRegistry as o } from "@umbraco-cms/backoffice/extension-registry";
const t = [
  {
    type: "workspaceContext",
    alias: "My.WorkspaceContext.NameManipulation",
    name: "Name Manipulation Workspace Context",
    api: () => import("./workspace-context-DBTuSfbJ.js"),
    conditions: [
      {
        alias: a,
        match: "Umb.Workspace.Document"
      },
      {
        alias: i
      }
    ]
  },
  {
    type: "workspaceView",
    alias: "My.WorkspaceView.Validation",
    name: "Validation Workspace View",
    element: () => import("./validation-view.element-C8WCA1Dp.js"),
    weight: 900,
    meta: {
      label: "Validation",
      pathname: "validation",
      icon: "icon-check"
    },
    conditions: [
      {
        alias: a,
        match: "Umb.Workspace.Document"
      }
    ]
  }
], m = () => {
  console.log("Registering name manipulation extension manifests"), t.forEach((e) => o.register(e));
};
export {
  t as manifests,
  m as onInit
};
//# sourceMappingURL=client.js.map
