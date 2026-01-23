import { UMB_WORKSPACE_CONDITION_ALIAS as a } from "@umbraco-cms/backoffice/workspace";
import { umbExtensionsRegistry as t } from "@umbraco-cms/backoffice/extension-registry";
const i = [
  {
    type: "workspaceContext",
    alias: "CustomValidator.WorkspaceContext.Validation",
    name: "Validation Workspace Context",
    api: () => import("./validation-workspace-context-C5LC-9vh.js"),
    conditions: [
      {
        alias: a,
        match: "Umb.Workspace.Document"
      }
    ]
  },
  {
    type: "workspaceView",
    alias: "CustomValidator.WorkspaceView.Validation",
    name: "Validation Workspace View",
    element: () => import("./validation-view.element-CRUWIUPv.js"),
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
  i.forEach((o) => t.register(o));
};
export {
  i as manifests,
  s as onInit
};
//# sourceMappingURL=umbraco-community-customvalidator.js.map
