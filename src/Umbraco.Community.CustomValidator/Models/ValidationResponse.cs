using System.Diagnostics.CodeAnalysis;

namespace Umbraco.Community.CustomValidator.Models;

using System.Text.Json.Serialization;

[ExcludeFromCodeCoverage]
public sealed record ValidationResponse
{
    public required Guid ContentId { get; init; }

    public bool HasValidator { get; init; }

    public IEnumerable<ValidationMessage>? Messages { get; init; }
}