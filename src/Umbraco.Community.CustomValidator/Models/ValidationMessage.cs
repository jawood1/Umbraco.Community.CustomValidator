using System.Diagnostics.CodeAnalysis;
using Umbraco.Community.CustomValidator.Enums;

namespace Umbraco.Community.CustomValidator.Models;

[ExcludeFromCodeCoverage]
public sealed record ValidationMessage
{
    public required string Message { get; set; }

    public required ValidationSeverity Severity { get; set; }

    public string? PropertyAlias { get; set; }

    /// <summary>
    /// Optional culture code (e.g. "en-US") for the property variant the message targets.
    /// Null means the property is invariant or the message applies to all cultures.
    /// </summary>
    public string? Culture { get; set; }
}