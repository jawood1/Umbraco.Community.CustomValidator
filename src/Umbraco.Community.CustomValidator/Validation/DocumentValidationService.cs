using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Community.CustomValidator.Enums;
using Umbraco.Community.CustomValidator.Interfaces;
using Umbraco.Community.CustomValidator.Models;

namespace Umbraco.Community.CustomValidator.Validation;

/// <summary>
/// Provides services for validating published content using registered document validators.
/// </summary>
/// <remarks>This service manages a collection of document validators and coordinates their execution against
/// published content. It supports asynchronous validation and caching of validators for improved performance. Thread
/// safety is ensured for validator cache operations
/// </remarks>
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

    /// <summary>
    /// Validates the specified content using all applicable custom validators.
    /// </summary>
    /// <remarks>If a validator throws an exception during execution, the error is logged and a generic
    /// validation error message is added to the results. Validation continues for remaining validators even if one
    /// fails.</remarks>
    /// <param name="content">The content item to validate. Cannot be null.</param>
    /// <returns>A collection of validation messages produced by the validators. The collection may be empty if no validation
    /// issues are found.</returns>
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
                    Message = $"An error occurred while running validation. Please check the logs.",
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
