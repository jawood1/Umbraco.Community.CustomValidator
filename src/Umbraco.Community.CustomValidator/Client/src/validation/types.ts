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
    relatedPropertyAliases?: string[];
}

export interface ValidationResult {
    contentId: string;
    hasValidator: boolean;
    messages: ValidationMessage[];
    culture?: string;
    treatWarningsAsErrors?: boolean;
}
