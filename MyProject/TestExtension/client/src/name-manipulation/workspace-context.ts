import { UmbControllerBase } from "@umbraco-cms/backoffice/class-api";
import type { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { UMB_CONTENT_WORKSPACE_CONTEXT } from "@umbraco-cms/backoffice/content";
import { UmbVariantId } from "@umbraco-cms/backoffice/variant";

export class NameManipulationWorkspaceContext extends UmbControllerBase  {
    constructor(host: UmbControllerHost) {
        super(host);

        console.log("NameManipulationWorkspaceContext: Constructor called");
        
        this.consumeContext(UMB_CONTENT_WORKSPACE_CONTEXT, async (workspace) => {
            console.log("NameManipulationWorkspaceContext: Workspace context consumed", workspace);
            if (!workspace) return;
            await workspace.isLoaded();
            // Set the name if it's already empty (We do not want to overwrite if it's a Blueprint)
            // Notice we need to provide a Variant-ID to getName, as Document names are variant specific.
            // Here we get the Invariant name — this will need to be extended if you are looking to support multiple variants.
            const variantId = UmbVariantId.CreateInvariant();
            const name = workspace.getName(variantId);
            if (name === undefined) {
                const manipulatedName = `New Document - ${new Date().toLocaleDateString(
                "en-US"
                )}`;
                workspace.setName(manipulatedName, variantId);
            }
        });
  }
}

export { NameManipulationWorkspaceContext as api };