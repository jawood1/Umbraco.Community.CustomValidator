using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Community.CustomValidator.Enums;
using Umbraco.Community.CustomValidator.Interfaces;
using Umbraco.Community.CustomValidator.Models;

namespace Umbraco.Community.CustomValidator.Validation;

/// <summary>
/// Registry for discovering and executing document validators.
/// </summary>
public sealed class CustomValidatorRegistry(
    IServiceScopeFactory serviceScopeFactory,
    IEnumerable<ValidatorMetadata> metadata,
    ILogger<CustomValidatorRegistry> logger)
{
    private readonly ConcurrentDictionary<Type, List<Type>> _validatorTypeCache = new();

    /// <summary>
    /// Clears the validator type cache.
    /// Metadata cannot be cleared as it's injected via DI.
    /// </summary>
    public void ClearValidatorCache()
    {
        _validatorTypeCache.Clear();
        logger.LogDebug("Validator type cache cleared");
    }

    /// <summary>
    /// Validates content by discovering and executing all matching validators.
    /// </summary>
    public async Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
    {
        var validatorTypes = GetOrAddValidatorTypesForContentType(content.GetType());
        var messages = new List<ValidationMessage>();

        using var scope = serviceScopeFactory.CreateScope();
        var scopedProvider = scope.ServiceProvider;

        foreach (var validatorType in validatorTypes)
        {
            try
            {
                // Resolve validator from scoped provider
                if (scopedProvider.GetRequiredService(validatorType) is not IDocumentValidator validator)
                {
                    logger.LogWarning("Could not resolve validator {ValidatorType}", validatorType.Name);
                    continue;
                }

                messages.AddRange(await validator.ValidateAsync(content));
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error executing validator {ValidatorType} for document {DocumentId}",
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

    /// <summary>
    /// Checks if a validator exists for the given content type.
    /// </summary>
    public bool HasValidator<T>(T publishedContent) where T : class, IPublishedContent
    {
        var validatorTypes = GetOrAddValidatorTypesForContentType(publishedContent.GetType());
        return validatorTypes.Count > 0;
    }

    /// <summary>
    /// Gets or caches which validator types apply to a given content type.
    /// </summary>
    private List<Type> GetOrAddValidatorTypesForContentType(Type contentType)
    {
        return _validatorTypeCache.GetOrAdd(contentType, type =>
        {
            var matchingValidatorTypes = new List<Type>();

            foreach (var metadata1 in metadata)
            {
                // Check if validator matches content type by name
                if (metadata1.NameOfType == type.Name)
                {
                    matchingValidatorTypes.Add(metadata1.ValidatorType);
                    continue;
                }

                // Check interfaces
                foreach (var iface in type.GetInterfaces())
                {
                    if (metadata1.NameOfType == iface.Name)
                    {
                        matchingValidatorTypes.Add(metadata1.ValidatorType);
                        break;
                    }
                }
            }

            logger.LogDebug("Content type {ContentType} matched {ValidatorCount} validator(s)",
                type.Name, matchingValidatorTypes.Count);

            return matchingValidatorTypes;
        });
    }
}