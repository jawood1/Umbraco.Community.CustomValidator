using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Community.CustomValidator.Enums;
using Umbraco.Community.CustomValidator.Interfaces;
using Umbraco.Community.CustomValidator.Models;

namespace Umbraco.Community.CustomValidator.Validation;

public sealed class CustomValidatorRegistry
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<CustomValidatorRegistry> _logger;
    private readonly ConcurrentDictionary<Type, List<Type>> _validatorTypeCache = new();

    // Cache validator metadata (type + NameOfType)
    private Lazy<List<ValidatorMetadata>> _validatorMetadata;

    public CustomValidatorRegistry(
        IServiceProvider serviceProvider,
        ILogger<CustomValidatorRegistry> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _validatorMetadata = CreateValidatorMetadata();
    }

    public void ClearValidatorCache()
    {
        _validatorTypeCache.Clear();
        _validatorMetadata = CreateValidatorMetadata();
    }

    private Lazy<List<ValidatorMetadata>> CreateValidatorMetadata()
    {
        return new Lazy<List<ValidatorMetadata>>(() =>
        {
            // Get all validators once to extract metadata
            var validators = _serviceProvider.GetServices<IDocumentValidator>();
            var metadata = validators
                .Select(v => new ValidatorMetadata
                {
                    Type = v.GetType(),
                    NameOfType = v.NameOfType
                })
                .DistinctBy(m => m.Type)
                .ToList();

            _logger.LogDebug("Discovered {ValidatorCount} validator types", metadata.Count);

            return metadata;
        }, LazyThreadSafetyMode.ExecutionAndPublication);
    }

    public async Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
    {
        var validatorTypes = GetOrAddValidatorTypesForContentType(content.GetType());
        var messages = new List<ValidationMessage>();

        foreach (var validatorType in validatorTypes)
        {
            try
            {
                // Resolve validator - creates new instance if Scoped/Transient
                if (_serviceProvider.GetRequiredService(validatorType) is not IDocumentValidator validator)
                {
                    _logger.LogWarning("Custom Validator: Could not resolve validator {ValidatorType}", validatorType.Name);
                    continue;
                }

                messages.AddRange(await validator.ValidateAsync(content));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Custom Validator: Error executing validator {ValidatorType} for document {DocumentId}",
                    validatorType.Name, content.Id);

                messages.Add(new ValidationMessage
                {
                    Message = "An error occurred while running validation. Please check the logs.",
                    Severity = ValidationSeverity.Error
                });
            }
        }

        return messages;
    }

    public bool HasValidator<T>(T publishedContent) where T : class, IPublishedContent
    {
        var validatorTypes = GetOrAddValidatorTypesForContentType(publishedContent.GetType());
        return validatorTypes.Count > 0;
    }

    private List<Type> GetOrAddValidatorTypesForContentType(Type contentType)
    {
        return _validatorTypeCache.GetOrAdd(contentType, type =>
        {
            var matchingValidatorTypes = new List<Type>();
            var allMetadata = _validatorMetadata.Value;

            foreach (var metadata in allMetadata)
            {
                // Check if validator matches content type by name
                if (metadata.NameOfType == type.Name)
                {
                    matchingValidatorTypes.Add(metadata.Type);
                    continue;
                }

                // Check interfaces
                foreach (var iface in type.GetInterfaces())
                {
                    if (metadata.NameOfType == iface.Name)
                    {
                        matchingValidatorTypes.Add(metadata.Type);
                        break;
                    }
                }
            }

            _logger.LogDebug("Content type {ContentType} matched {ValidatorCount} validator(s)",
                type.Name, matchingValidatorTypes.Count);

            return matchingValidatorTypes;
        });
    }

    private class ValidatorMetadata
    {
        public required Type Type { get; init; }
        public required string NameOfType { get; init; }
    }
}