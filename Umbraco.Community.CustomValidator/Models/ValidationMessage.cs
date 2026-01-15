using Umbraco.Community.CustomValidator.Enums;

namespace Umbraco.Community.CustomValidator.Models;

public sealed record ValidationMessage
{
    public required string Message { get; set; }

    public required ValidationSeverity Severity { get; set; }
}