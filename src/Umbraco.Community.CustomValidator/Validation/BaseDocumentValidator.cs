using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Community.CustomValidator.Enums;
using Umbraco.Community.CustomValidator.Interfaces;
using Umbraco.Community.CustomValidator.Models;

namespace Umbraco.Community.CustomValidator.Validation;

public abstract class BaseDocumentValidator<T>(string contentTypeAlias) : IDocumentValidator<T>, IDocumentValidator
    where T : class, IPublishedContent
{
    public required string ContentTypeAlias { get; init; } = contentTypeAlias;

    public abstract Task<IEnumerable<ValidationMessage>> ValidateAsync(T content);

    public async Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
    {
        if (content is not T typedContent)
        {
            return
            [
                new ValidationMessage
                {
                    Message = $"Content is not of expected type {typeof(T).Name}",
                    Severity = ValidationSeverity.Error
                }
            ];
        }

        return await ValidateAsync(typedContent);
    }
}
