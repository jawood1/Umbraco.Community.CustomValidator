using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;
using Umbraco.Community.CustomValidator.Models;

namespace Umbraco.Community.CustomValidator.Validation;

/// <summary>
/// Validator lookup registry built once at startup.
/// </summary>
public sealed class ValidatorLookup
{
    private readonly IReadOnlyDictionary<Type, IReadOnlyList<Type>> _typeMap;
    private readonly ConcurrentDictionary<Type, IReadOnlyList<Type>> _resolvedCache = new();
    private readonly ILogger<ValidatorLookup> _logger;

    public ValidatorLookup(
        IEnumerable<ValidatorMetadata> metadata,
        ILogger<ValidatorLookup> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        _typeMap = metadata
            .GroupBy(m => m.ContentType)
            .ToDictionary(
                g => g.Key,
                g => (IReadOnlyList<Type>)g.Select(m => m.ValidatorType).Distinct().ToList()
            );

        _logger.LogInformation("ValidatorLookup initialized with {TypeCount} content types and {ValidatorCount} total validators",
            _typeMap.Count, metadata.Count());
    }

    /// <summary>
    /// Gets all validator types for a given content type.
    /// Checks exact type match first, then interfaces.
    /// Results are cached for O(1) subsequent lookups.
    /// </summary>
    public IReadOnlyList<Type> GetValidatorsFor(Type contentType)
    {
        // Check cache first
        if (_resolvedCache.TryGetValue(contentType, out var cachedValidators))
        {
            return cachedValidators;
        }

        var matchingValidators = new List<Type>();

        if (_typeMap.TryGetValue(contentType, out var exactMatchValidators))
        {
            matchingValidators.AddRange(exactMatchValidators);
        }

        foreach (var iface in contentType.GetInterfaces())
        {
            if (_typeMap.TryGetValue(iface, out var interfaceValidators))
            {
                matchingValidators.AddRange(interfaceValidators);
            }
        }

        var result = (IReadOnlyList<Type>)matchingValidators.Distinct().ToList();

        _resolvedCache.TryAdd(contentType, result);

        _logger.LogDebug("Content type {ContentType} matched {ValidatorCount} validator(s) (cached for future use)",
            contentType.Name, result.Count);

        return result;
    }
}