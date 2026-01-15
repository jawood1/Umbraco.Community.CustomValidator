using Umbraco.Community.CustomValidator.Enums;

namespace Umbraco.Community.CustomValidator.Models;

public sealed class ValidationMessage
{
    public required string Message { get; set; }

    public ValidationSeverity Severity { get; set; }
}