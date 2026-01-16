import { UMB_WORKSPACE_CONDITION_ALIAS as t } from "@umbraco-cms/backoffice/workspace";
import { umbExtensionsRegistry as o } from "@umbraco-cms/backoffice/extension-registry";
const i = [
  {
    type: "workspaceContext",
    alias: "CustomValidator.WorkspaceContext.Validation",
    name: "Validation Workspace Context",
    api: () => import("./validation-workspace-context-BTUL9Nvg.js").then((a) => a.v),
    conditions: [
      {
        alias: t,
        match: "Umb.Workspace.Document"
      }
    ]
  },
  {
    type: "workspaceView",
    alias: "CustomValidator.WorkspaceView.Validation",
    name: "Validation Workspace View",
    element: () => import("./validation-view.element-j2Rbq1Yu.js"),
    weight: 1,
    meta: {
      label: "Validation",
      pathname: "validation",
      icon: "icon-alert"
    },
    conditions: [
      {
        alias: t,
        match: "Umb.Workspace.Document"
      }
    ]
  }
], s = () => {
  i.forEach((a) => o.register(a));
};
export {
  i as manifests,
  s as onInit
};
//# sourceMappingURL=umbraco-community-customvalidator.js.map
