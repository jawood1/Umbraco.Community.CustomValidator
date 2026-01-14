export interface ValidationMessage {
    message: string;
    severity: string;
    propertyAlias: string | null;
}

export interface ValidationResult {
    contentId: string;
    contentTypeAlias: string;
    hasValidator: boolean;
    messages: ValidationMessage[];
}
