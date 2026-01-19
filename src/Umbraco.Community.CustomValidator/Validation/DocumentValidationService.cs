using System.Collections.Concurrent;
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
    private readonly ConcurrentDictionary<Type, List<IDocumentValidator>> _validatorCache = new();

    public DocumentValidationService(
        IEnumerable<IDocumentValidator> validators,
        ILogger<DocumentValidationService> logger)
    {
        _validators = validators.ToDictionary(v => v.NameOfType, v => v);
        _logger = logger;
    }

    public void ClearValidatorCache() => _validatorCache.Clear();

    public async Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
    {
        var validators = GetOrAddValidatorsForType(content.GetType());

        var messages = new List<ValidationMessage>();

        foreach (var validator in validators)
        {
            try
            {
                messages.AddRange(await validator.ValidateAsync(content));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing custom validator for {ValidatorType}, document ID {DocumentId}", validator.GetType().Name, content.Id);

                messages.Add(new ValidationMessage
                {
                    Message = $"An error occurred while running validation for {validator.GetType().Name}.",
                    Severity = ValidationSeverity.Error
                });
            }
        }

        return messages;
    }

    public bool HasValidator<T>(T publishedContent) where T : class, IPublishedContent
    {
        var validators = GetOrAddValidatorsForType(publishedContent.GetType());
        return validators.Count > 0;
    }

    private List<IDocumentValidator> GetOrAddValidatorsForType(Type type) =>
        _validatorCache.GetOrAdd(type, t =>
        {
            var found = new HashSet<IDocumentValidator>();

            if (_validators.TryGetValue(t.Name, out var typeValidator))
                found.Add(typeValidator);

            foreach (var iface in t.GetInterfaces())
            {
                if (_validators.TryGetValue(iface.Name, out var ifaceValidator))
                    found.Add(ifaceValidator);
            }

            return found.ToList();
        });

}
