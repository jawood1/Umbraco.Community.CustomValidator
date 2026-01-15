using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Community.CustomValidator.Interfaces;
using Umbraco.Community.CustomValidator.Models;

namespace Umbraco.Community.CustomValidator.Validation;

public sealed class DocumentValidationService
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
            return [];
        }

        return await validator.ValidateAsync(content);
    }

    public bool HasValidator(string contentTypeAlias) => _validators.ContainsKey(contentTypeAlias);
}
