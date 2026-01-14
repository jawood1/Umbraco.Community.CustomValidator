export interface ValidationMessage {
    message: string;
    severity: string;
}

export interface ValidationResult {
    contentId: string;
    contentTypeAlias: string;
    hasValidator: boolean;
    messages: ValidationMessage[];
}
