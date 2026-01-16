namespace Umbraco.Community.CustomValidator.Models;

internal sealed record ValidationResponse
{
    public required Guid ContentId { get; init; }

    public required string ContentTypeAlias { get; init; }

    public bool HasValidator { get; init; }

    public IEnumerable<ValidationMessage>? Messages { get; init; }
}