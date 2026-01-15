namespace Umbraco.Community.CustomValidator.Models;

internal sealed class ValidationResponse
{
    public required Guid ContentId { get; set; }

    public required string ContentTypeAlias { get; set; }

    public bool HasValidator { get; set; }

    public IEnumerable<ValidationMessage>? Messages { get; set; }
}