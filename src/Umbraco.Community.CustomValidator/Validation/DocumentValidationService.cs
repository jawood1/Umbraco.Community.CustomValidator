using System.Collections.Concurrent;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Community.CustomValidator.Enums;
using Umbraco.Community.CustomValidator.Interfaces;
using Umbraco.Community.CustomValidator.Models;

namespace Umbraco.Community.CustomValidator.Validation;

public sealed class DocumentValidationService(
    IServiceProvider serviceProvider,
    ILogger<DocumentValidationService> logger)
{
    private readonly ConcurrentDictionary<Type, List<string>> _validatorNameCache = new();

    public void ClearValidatorCache() => _validatorNameCache.Clear();

    public async Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
    {
        // Get validator names for this content type (cached)
        var validatorNames = GetOrAddValidatorNamesForContentType(content.GetType());

        var messages = new List<ValidationMessage>();

        // Get all registered validators from DI
        var allValidators = serviceProvider.GetServices<IDocumentValidator>();

        foreach (var validatorName in validatorNames)
        {
            try
            {
                // Find the validator with matching name
                var validator = allValidators.FirstOrDefault(v => v.NameOfType == validatorName);

                if (validator == null)
                {
                    logger.LogWarning("Could not find validator for type {ValidatorName}", validatorName);
                    continue;
                }

                messages.AddRange(await validator.ValidateAsync(content));
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error executing validator {ValidatorName} for document {DocumentId}",
                    validatorName, content.Id);

                messages.Add(new ValidationMessage
                {
                    Message = $"An error occurred while running validation. Please check the logs.",
                    Severity = ValidationSeverity.Error
                });
            }
        }

        return messages;
    }

    public bool HasValidator<T>(T publishedContent) where T : class, IPublishedContent
    {
        var validatorNames = GetOrAddValidatorNamesForContentType(publishedContent.GetType());
        return validatorNames.Count > 0;
    }

    private List<string> GetOrAddValidatorNamesForContentType(Type contentType)
    {
        return _validatorNameCache.GetOrAdd(contentType, type =>
        {
            var found = new HashSet<string>();

            // Get all registered validators
            var allValidators = serviceProvider.GetServices<IDocumentValidator>();

            foreach (var validator in allValidators)
            {
                // Check if validator matches content type by name
                if (validator.NameOfType == type.Name)
                {
                    found.Add(validator.NameOfType);
                }

                // Check interfaces
                foreach (var iface in type.GetInterfaces())
                {
                    if (validator.NameOfType == iface.Name)
                    {
                        found.Add(validator.NameOfType);
                    }
                }
            }

            return found.ToList();
        });
    }
}