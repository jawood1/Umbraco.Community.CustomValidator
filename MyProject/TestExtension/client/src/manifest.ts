import {
  UMB_WORKSPACE_CONDITION_ALIAS,
  UMB_WORKSPACE_ENTITY_IS_NEW_CONDITION_ALIAS,
} from "@umbraco-cms/backoffice/workspace";
import { umbExtensionsRegistry } from "@umbraco-cms/backoffice/extension-registry";

export const manifests : Array<UmbExtensionManifest> = [
    {
        type: "workspaceContext",
        alias: "My.WorkspaceContext.Validation",
        name: "Validation Workspace Context",
        api: () => import("./validation/validation-workspace-context.js"),
        conditions: [
            {
                alias: UMB_WORKSPACE_CONDITION_ALIAS,
                match: "Umb.Workspace.Document",
            }
        ],
    },
    {
        type: "workspaceView",
        alias: "My.WorkspaceView.Validation",
        name: "Validation Workspace View",
        element: () => import("./validation/validation-view.element.js"),
        weight: 1,
        meta: {
            label: "Validation",
            pathname: "validation",
            icon: "icon-alert",
        },
        conditions: [
            {
                alias: UMB_WORKSPACE_CONDITION_ALIAS,
                match: "Umb.Workspace.Document",
            }
        ],
    }
];

export const onInit = () => {
    console.log("Registering name manipulation extension manifests");
    manifests.forEach((manifest) => umbExtensionsRegistry.register(manifest));
};
