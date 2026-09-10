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
    /// Optional additional property aliases that this message also relates to (e.g. a cross-field
    /// validation where one property must be true for another to be valid). When set, the inline
    /// field badge for this message is shown on <see cref="PropertyAlias"/> AND every alias listed
    /// here. Does not affect the Validation tab's severity counts or publish-blocking logic.
    /// </summary>
    public IEnumerable<string>? RelatedPropertyAliases { get; set; }
}