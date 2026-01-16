using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Community.CustomValidator.Enums;
using Umbraco.Community.CustomValidator.Interfaces;
using Umbraco.Community.CustomValidator.Models;

namespace Umbraco.Community.CustomValidator.Validation;

public sealed class DocumentValidationService
{
    private readonly Dictionary<string, IDocumentValidator> _validators;
    private readonly ILogger<DocumentValidationService> _logger;

    public DocumentValidationService(
        IEnumerable<IDocumentValidator> validators,
        ILogger<DocumentValidationService> logger)
    {
        _validators = validators.ToDictionary(v => v.ContentTypeAlias, v => v);
        _logger = logger;
    }

    public async Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
    {
        if (!_validators.TryGetValue(content.ContentType.Alias, out var validator))
            return [];

        try
        {
            return await validator.ValidateAsync(content);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing validator for content type {ContentTypeAlias}, document ID {DocumentId}", 
                content.ContentType.Alias, content.Id);
            return
            [
                new ValidationMessage
                {
                    Message = "An error occurred while running validation. Please check the logs for details.",
                    Severity = ValidationSeverity.Error
                }
            ];
        }
    }

    public bool HasValidator(string contentTypeAlias) => _validators.ContainsKey(contentTypeAlias);
}
