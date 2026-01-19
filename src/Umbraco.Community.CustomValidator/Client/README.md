# Custom Validator Frontend

This folder contains the frontend TypeScript/Lit components for the Umbraco Community Custom Validator package.

## Architecture

The frontend is built using:
- **TypeScript** - Type-safe JavaScript
- **Lit** - Web Components library used by Umbraco backoffice
- **@umbraco-cms/backoffice** - Umbraco backoffice API and components
- **Vite** - Build tool for bundling

## Project Structure

```
src/
├── manifest.ts                          # Extension registration
└── validation/
   ├── types.ts                        # TypeScript type definitions (enums, interfaces)
   ├── validation-constants.ts         # Constants for delays, severity, etc.
   ├── validation-utils.ts             # Utility functions for validation logic
   ├── validation-api.service.ts       # API service for backend communication
   ├── validation-workspace-context.ts # Shared context/state management
   └── validation-view.element.ts      # Main UI component (imports types, constants, utils)
```

## Key Components

### manifest.ts

Registers extensions with the Umbraco backoffice:

- **workspaceContext** - Provides shared validation state across the workspace
- **workspaceView** - Adds the "Validation" tab to document workspaces


### types.ts

Defines all validation-related TypeScript types and enums, such as `ValidationSeverity`, `ValidationMessage`, and `ValidationResult`.

### validation-constants.ts

Contains constants for delays, severity order, and color mapping. Used throughout the validation UI for consistency.

### validation-utils.ts

Reusable utility functions for validation logic, such as message counting and severity color mapping. Imported by the main view component.

### validation-api.service.ts

Handles HTTP communication with the backend API:

- `validateDocument(documentId, culture?)` - Calls `/umbraco/management/api/v1/validation/validate/{id}`
- Includes authentication token in requests
- Returns `ValidationResult`

### validation-workspace-context.ts

Manages validation state using Umbraco's context API:

- **Purpose**: Share validation results between component instances
- **Key Methods**:
  - `validateManually(documentId, culture?)` - Triggers validation and stores result
  - `getValidationResult(culture?)` - Retrieves cached validation result for a culture
  - `hasBlockingErrors(culture?)` - Checks if Error-level messages exist
  - `clearValidation()` - Clears all cached results

- **State Management**:
  - Stores validation results per culture in a `Map<string, ValidationResult>`
  - Observable `isValidating` state for loading indicators
  - Provides context to all components in the workspace


### validation-view.element.ts

The main UI component for the validation tab. Now imports types, constants, and utility functions from separate files for maintainability.

**Key Features:**

1. **Separation of Concerns**
   - Types, constants, and utility functions are imported from their own files.
   - The main view focuses on UI logic and rendering.

2. **Split View & Multi-Culture Support**
   - Each instance is assigned a culture based on split view registration order.
   - Validation results are managed per culture and displayed accordingly.

3. **Lifecycle Management**
   - `connectedCallback()`: Sets up contexts, observers, and triggers initial validation.
   - `disconnectedCallback()`: Cleans up observers and split view registration.

4. **Validation Triggers**
   - Initial load (with delay)
   - Document switch
   - Culture/variant change
   - Manual validation (Save & Validate button)

5. **UI Rendering**
   - Uses imported constants and utility functions for message sorting, severity color, and counts.
   - Renders loading, success, and error states per culture.
   - Shows controls only if a validator is present.

## State Flow

```
1. User opens document
   ↓
2. validation-view.element mounts
   ↓
3. Consumes VALIDATION_WORKSPACE_CONTEXT
   ↓
4. Observes workspace.variants for culture
   ↓
5. Triggers validation via context.validateManually()
   ↓
6. validation-api.service.validateDocument() calls backend
   ↓
7. Result stored in context per culture
   ↓
8. Component retrieves result via context.getValidationResult()
   ↓
9. UI updates with validation messages
```

## Multi-Culture / Split View Logic

When content has multiple cultures:

1. **Single View**: Shows validation for the active culture
2. **Split View**: 
   - Two component instances are created
   - `instanceCounter` assigns IDs: 0 and 1
   - Each instance maps its ID to a variant index
   - Instance 0 → variant[0] (e.g., en-US)
   - Instance 1 → variant[1] (e.g., da-DK)
   - Each validates and displays its assigned culture


## Constants & Utilities

All constants (delays, severity order, color mapping) are now in `validation-constants.ts`.
All reusable logic (message counting, severity color) is in `validation-utils.ts`.

## Building

## Publish Button Limitation

**Note:** Due to Umbraco's public API limitations, custom workspace views cannot trigger the full publish workflow (including variant selection and modals). The built-in publish button in the main toolbar should be used for publishing content. The custom view only supports "Save & Validate" for manual validation.

```bash
# Install dependencies
npm install

# Build for development
npm run build

# Build and watch for changes
npm run dev
```

Build output goes to `../wwwroot/App_Plugins/Umbraco.Community.CustomValidator/`

## Development Notes


### Adding New Features

1. Update or add types in `types.ts` as needed
2. Add or update constants in `validation-constants.ts`
3. Add or update utility functions in `validation-utils.ts`
4. Modify API service or context if backend/state changes are needed
5. Enhance the UI component by importing and using new logic

### Debugging Split View

- Check console for instance IDs and variant detection
- Verify culture assignment in `#getVariantIndex()`
- Ensure each instance stores results with correct culture key

### Performance Considerations

- Memoized computed properties prevent unnecessary recalculations
- Validation results cached in context to avoid duplicate API calls
- Observers properly cleaned up in `disconnectedCallback()`

## Umbraco Backoffice Integration

This package integrates with Umbraco's extension system:

- **Extension Types**: `workspaceContext`, `workspaceView`
- **Conditions**: Only active in document workspaces
- **Contexts**: Uses Umbraco's context API for state sharing
- **Observables**: Reactive state management with `UmbObjectState`
- **Lit Components**: Web Components that extend `UmbLitElement`

## API Endpoint

The frontend communicates with:
```
GET /umbraco/management/api/v1/validation/validate/{id}?culture={culture}
```

Response format matches `ValidationResult` interface.
