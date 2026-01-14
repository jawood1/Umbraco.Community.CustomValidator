using Umbraco.Cms.Core.Models.PublishedContent;

namespace MyProject.Validation;

public abstract class BaseDocumentValidator<T> : IDocumentValidator<T>, IDocumentValidator where T : IPublishedContent
{
    public string ContentTypeAlias { get; }

    protected BaseDocumentValidator(string contentTypeAlias)
    {
        ContentTypeAlias = contentTypeAlias;
    }

    public abstract Task<IEnumerable<ValidationMessage>> ValidateAsync(T content);

    public async Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
    {
        if (content is not T typedContent)
        {
            return new[]
            {
                new ValidationMessage
                {
                    Message = $"Content is not of expected type {typeof(T).Name}",
                    Severity = ValidationSeverity.Error
                }
            };
        }

        return await ValidateAsync(typedContent);
    }
}
