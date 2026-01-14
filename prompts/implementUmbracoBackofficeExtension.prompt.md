---
name: implementUmbracoBackofficeExtension
description: Create Umbraco 17 backoffice extension with backend API and frontend workspace view
argument-hint: Extension purpose and target workspace type (e.g., document validation, content actions)
---

Implement a complete Umbraco 17 backoffice extension with both backend and frontend components:

## Backend Implementation

1. **Create strongly-typed backend services** using ModelsBuilder generated models
   - Define interfaces for the service contract
   - Implement base classes with generic type parameters
   - Create concrete implementations for specific content types
   - Use dependency injection for service registration

2. **Build Management API controller**
   - Use `ManagementApiControllerBase` as base class
   - Apply `[VersionedApiBackOfficeRoute]` attribute for routing
   - Add `[ApiExplorerSettings]` for API documentation
   - Return appropriate HTTP status codes and response models

3. **Register services with IComposer**
   - Create composer class implementing `IComposer`
   - Register services in dependency injection container
   - Ensure proper service lifetimes (Singleton, Scoped, Transient)

## Frontend Implementation

1. **Create TypeScript workspace extension**
   - Define TypeScript interfaces matching backend response models
   - Create API service class extending `UmbControllerBase`
   - Use `UMB_AUTH_CONTEXT` for authenticated API calls with Bearer tokens
   - Build Lit element component extending `UmbLitElement`
   - Implement `UmbWorkspaceViewElement` interface for workspace views

2. **Implement workspace view component**
   - Consume `UMB_CONTENT_WORKSPACE_CONTEXT` to access workspace data
   - Use `@customElement`, `@state` decorators for reactive properties
   - Implement UI with Umbraco UI components (uui-button, uui-box, uui-badge, etc.)
   - Handle loading states, errors, and empty states appropriately
   - Export component as `element` for manifest loading

3. **Register extension in manifest**
   - Add manifest entry with appropriate extension type (workspaceView, workspaceContext, etc.)
   - Define conditions for when extension should appear
   - Set weight for tab ordering (higher = further left)
   - Configure meta properties (label, pathname, icon)

4. **Build and compile**
   - Use Vite for bundling TypeScript to JavaScript
   - Output to `/App_Plugins/` directory
   - Register backofficeEntryPoint in umbraco-package.json

## Key Patterns

- **Authentication**: Always use `UMB_AUTH_CONTEXT.getLatestToken()` and `Authorization: Bearer ${token}` header
- **Styling**: Import `UmbTextStyles` and use inline `<style>` tags or external CSS files
- **Context Consumption**: Use `consumeContext()` in constructor, `observe()` for reactive values
- **Error Handling**: Display user-friendly error messages in UI, log technical details to console
- **API Routes**: Management API uses `/umbraco/management/api/v1/` prefix automatically

## Testing Steps

1. Build frontend with `npm run build`
2. Start Umbraco with `dotnet run`
3. Navigate to target workspace in backoffice
4. Verify extension appears and functions correctly
5. Check browser console for errors
6. Test API endpoints with network inspector
