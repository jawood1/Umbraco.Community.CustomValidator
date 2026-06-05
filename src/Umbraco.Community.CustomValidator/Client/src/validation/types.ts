// Enum for validation severity levels to match backend
export enum ValidationSeverity {
    Error = 'Error',
    Warning = 'Warning',
    Info = 'Info'
}

// Type-safe literal types for notification colors
export type NotificationColor = 'danger' | 'warning' | 'default' | 'positive';

export interface ValidationMessage {
    message: string;
    severity: ValidationSeverity;
    propertyAlias?: string;
    /** Culture code (e.g. "en-US") for the target property variant. Null/absent = invariant. */
    culture?: string;
}

export interface ValidationResult {
    contentId: string;
    hasValidator: boolean;
    messages: ValidationMessage[];
    /** Culture code (e.g. "en-US") that this validation response is for. Null/absent = invariant. */
    culture?: string;
}
