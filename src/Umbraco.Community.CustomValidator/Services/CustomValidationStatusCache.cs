using System.Collections.Concurrent;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Umbraco.Community.CustomValidator.Enums;

namespace Umbraco.Community.CustomValidator.Services;

/// <summary>
/// Lightweight cache for tracking document validation status.
/// Uses IMemoryCache for reliable null-value handling.
/// </summary>
public sealed class CustomValidationStatusCache(
    IMemoryCache cache,
    ILogger<CustomValidationStatusCache> logger)
{
    private readonly ConcurrentDictionary<Guid, bool> _statusTracker = new();

    private const int StatusCacheMinutes = 5;
    private const string CacheKeyPrefix = "customValidationStatus";

    /// <summary>
    /// Gets validation status for a single document.
    /// </summary>
    /// <param name="documentId">The document identifier.</param>
    /// <returns>Validation status (Unknown if not cached).</returns>
    public ValidationStatus GetStatus(Guid documentId)
    {
        var cacheKey = GetCacheKey(documentId);

        if (cache.TryGetValue<ValidationStatus>(cacheKey, out var status))
        {
            logger.LogTrace("Status cache HIT for {DocumentId}: {Status}", documentId, status);
            return status;
        }

        logger.LogTrace("Status cache MISS for {DocumentId}", documentId);
        return ValidationStatus.Unknown;
    }

    /// <summary>
    /// Sets validation status for a document.
    /// </summary>
    /// <param name="documentId">The document identifier.</param>
    /// <param name="status">The validation status.</param>
    public void SetStatus(Guid documentId, ValidationStatus status)
    {
        var cacheKey = GetCacheKey(documentId);

        var cacheOptions = new MemoryCacheEntryOptions()
            .SetAbsoluteExpiration(TimeSpan.FromMinutes(StatusCacheMinutes))
            .SetPriority(CacheItemPriority.Low)
            .RegisterPostEvictionCallback((key, value, reason, state) =>
            {
                _statusTracker.TryRemove(documentId, out _);
                logger.LogTrace("Status cache evicted for {DocumentId}, reason: {Reason}",
                    documentId, reason);
            });

        cache.Set(cacheKey, status, cacheOptions);
        _statusTracker.TryAdd(documentId, true);

        logger.LogDebug("Validation status set for {DocumentId}: {Status}", documentId, status);
    }

    /// <summary>
    /// Sets status based on whether document has errors.
    /// </summary>
    /// <param name="documentId">The document identifier.</param>
    /// <param name="hasErrors">True if document has validation errors.</param>
    public void SetStatus(Guid documentId, bool hasErrors)
    {
        SetStatus(documentId, hasErrors ? ValidationStatus.HasErrors : ValidationStatus.Valid);
    }

    /// <summary>
    /// Clears validation status for a document.
    /// Called when content is saved to invalidate status.
    /// </summary>
    /// <param name="documentId">The document identifier.</param>
    public void ClearStatus(Guid documentId)
    {
        var cacheKey = GetCacheKey(documentId);
        cache.Remove(cacheKey);
        _statusTracker.TryRemove(documentId, out _);

        logger.LogDebug("Cleared validation status for {DocumentId}", documentId);
    }

    /// <summary>
    /// Clears validation status for all documents.
    /// </summary>
    public void ClearAll()
    {
        var allDocuments = _statusTracker.Keys.ToList();

        foreach (var documentId in allDocuments)
        {
            var cacheKey = GetCacheKey(documentId);
            cache.Remove(cacheKey);
        }

        _statusTracker.Clear();

        logger.LogInformation("Cleared all validation status cache ({Count} documents)", allDocuments.Count);
    }

    private static string GetCacheKey(Guid documentId) =>
        $"{CacheKeyPrefix}_{documentId}";
}