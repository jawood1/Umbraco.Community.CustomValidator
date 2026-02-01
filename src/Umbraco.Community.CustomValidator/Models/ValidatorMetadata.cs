using System.Diagnostics.CodeAnalysis;

namespace Umbraco.Community.CustomValidator.Models;

[ExcludeFromCodeCoverage]
public sealed record ValidatorMetadata
{
    public required Type ValidatorType { get; init; }

    public required string NameOfType { get; init; }
}
