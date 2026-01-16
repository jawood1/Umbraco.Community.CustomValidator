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
    ├── types.ts                        # TypeScript type definitions
    ├── validation-api.service.ts       # API service for backend communication
    ├── validation-workspace-context.ts # Shared context/state management
    └── validation-view.element.ts      # Main UI component
```

## Key Components

### manifest.ts

Registers extensions with the Umbraco backoffice:

- **workspaceContext** - Provides shared validation state across the workspace
- **workspaceView** - Adds the "Validation" tab to document workspaces

### types.ts

Defines TypeScript interfaces and enums:

```typescript
enum ValidationSeverity {
    Error = 'Error',
    Warning = 'Warning',
    Info = 'Info'
}

interface ValidationMessage {
    message: string;
    severity: ValidationSeverity;
}

interface ValidationResult {
    contentId: string;
    contentTypeAlias: string;
    hasValidator: boolean;
    messages: ValidationMessage[];
}
```

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

The main UI component that renders the validation tab:

**Key Features**:

1. **Instance-Based Split View Detection**
   - Each component instance gets a unique ID from `instanceCounter`
   - Maps instance ID to variant array index for culture assignment
   - Ensures correct culture validation in split-view mode

2. **Lifecycle Management**
   ```typescript
   connectedCallback()    // Sets up contexts, observers, initial validation
   willUpdate()           // Memoizes computed properties for performance
   disconnectedCallback() // Cleans up observers, resets instance counter
   ```

3. **Validation Triggers**
   - Initial load with delay (avoids save modal)
   - Document switch detection
   - Culture/variant change in split view
   - Manual validation button
   - Save & Validate button (manual validation)

4. **Memoized Properties**
   - `_sortedMessages` - Messages sorted by severity (Error > Warning > Info)
   - `_messageCounts` - Count of errors and warnings

5. **UI Rendering**
   - Success message when no errors/warnings
   - Color-coded messages by severity
   - Loading states
   - Manual validation controls
   - No custom publish integration (see limitations below)

6. **Split View Support**
   - Tracks variant changes using `workspace.variants` observable
   - Assigns culture based on instance ID and variant count
   - Stores results per culture in shared context
   - Each pane shows its culture-specific validation

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

## Constants

```typescript
SAVE_DELAY_MS = 500                  // Delay after save before validation
INITIAL_VALIDATION_DELAY_MS = 1000   // Delay on initial load
INSTANCE_RESET_DELAY_MS = 2000       // Delay before resetting instance counter

SEVERITY_ORDER = {
    Error: 0,
    Warning: 1,
    Info: 2
}

SEVERITY_COLOR_MAP = {
    Error: 'danger',
    Warning: 'warning',
    Info: 'default'
}
```

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

1. Update types in `types.ts`
2. Modify API service if backend changes needed
3. Update context for state management
4. Enhance UI component with new rendering logic

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
