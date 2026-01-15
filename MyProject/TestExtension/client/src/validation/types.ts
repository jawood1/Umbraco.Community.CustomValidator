// Type-safe literal types for validation severity levels
export type ValidationSeverity = 'Error' | 'Warning' | 'Info';

// Type-safe literal types for notification colors
export type NotificationColor = 'danger' | 'warning' | 'default' | 'positive';

export interface ValidationMessage {
    message: string;
    severity: ValidationSeverity;
}

export interface ValidationResult {
    contentId: string;
    contentTypeAlias: string;
    hasValidator: boolean;
    messages: ValidationMessage[];
}
