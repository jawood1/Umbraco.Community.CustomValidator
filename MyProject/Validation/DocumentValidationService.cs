using Umbraco.Cms.Core.Models.PublishedContent;

namespace MyProject.Validation;

public class DocumentValidationService
{
    private readonly Dictionary<string, IDocumentValidator> _validators;

    public DocumentValidationService(IEnumerable<IDocumentValidator> validators)
    {
        _validators = validators.ToDictionary(v => v.ContentTypeAlias, v => v);
    }

    public async Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
    {
        if (!_validators.TryGetValue(content.ContentType.Alias, out var validator))
        {
            return Array.Empty<ValidationMessage>();
        }

        return await validator.ValidateAsync(content);
    }

    public bool HasValidator(string contentTypeAlias)
    {
        return _validators.ContainsKey(contentTypeAlias);
    }
}
