import { UMB_WORKSPACE_CONDITION_ALIAS as a } from "@umbraco-cms/backoffice/workspace";
import { umbExtensionsRegistry as o } from "@umbraco-cms/backoffice/extension-registry";
const e = [
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
    element: () => import("./validation-view.element-C6Y6WjaL.js"),
    weight: 1,
    meta: {
      label: "Validation",
      pathname: "validation",
      icon: "icon-alert"
    },
    conditions: [
      {
        alias: a,
        match: "Umb.Workspace.Document"
      }
    ]
  }
], s = () => {
  console.log("Registering name manipulation extension manifests"), e.forEach((i) => o.register(i));
};
export {
  e as manifests,
  s as onInit
};
//# sourceMappingURL=client.js.map
