import { UMB_WORKSPACE_CONDITION_ALIAS as a, UMB_WORKSPACE_ENTITY_IS_NEW_CONDITION_ALIAS as e } from "@umbraco-cms/backoffice/workspace";
import { umbExtensionsRegistry as i } from "@umbraco-cms/backoffice/extension-registry";
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
        alias: e
      }
    ]
  },
  {
    type: "workspaceContext",
    alias: "My.WorkspaceContext.Validation",
    name: "Validation Workspace Context",
    api: () => import("./validation-workspace-context-Dzg7J8I0.js"),
    conditions: [
      {
        alias: a,
        match: "Umb.Workspace.Document"
      }
    ]
  },
  {
    type: "workspaceView",
    alias: "My.WorkspaceView.Validation",
    name: "Validation Workspace View",
    element: () => import("./validation-view.element-DgBk1YLW.js"),
    weight: 1,
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
], c = () => {
  console.log("Registering name manipulation extension manifests"), t.forEach((o) => i.register(o));
};
export {
  t as manifests,
  c as onInit
};
//# sourceMappingURL=client.js.map
