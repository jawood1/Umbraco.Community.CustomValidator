using Umbraco.Community.CustomValidator.Enums;
using System.Diagnostics.CodeAnalysis;

namespace Umbraco.Community.CustomValidator.Models;

[ExcludeFromCodeCoverage]
public sealed record ValidationMessage
{
    public required string Message { get; set; }

    public required ValidationSeverity Severity { get; set; }
}