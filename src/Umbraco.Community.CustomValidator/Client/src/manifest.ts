import {UMB_WORKSPACE_CONDITION_ALIAS } from "@umbraco-cms/backoffice/workspace";
import { umbExtensionsRegistry } from "@umbraco-cms/backoffice/extension-registry";

export const manifests : Array<UmbExtensionManifest> = [
    {
        type: "workspaceContext",
        alias: "CustomValidator.WorkspaceContext.Validation",
        name: "Validation Workspace Context",
        api: () => import("./contexts/validation-workspace-context.js"),
        conditions: [
            {
                alias: UMB_WORKSPACE_CONDITION_ALIAS,
                match: "Umb.Workspace.Document",
            }
        ],
    },
    {
        type: "workspaceView",
        alias: "CustomValidator.WorkspaceView.Validation",
        name: "Validation Workspace View",
        element: () => import("./views/validation-view.element.js"),
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
    manifests.forEach((manifest) => umbExtensionsRegistry.register(manifest));
};
