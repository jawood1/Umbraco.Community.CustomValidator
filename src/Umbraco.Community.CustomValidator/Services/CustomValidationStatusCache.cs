using System.Collections.Concurrent;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Umbraco.Community.CustomValidator.Enums;

namespace Umbraco.Community.CustomValidator.Services;

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
    public void SetStatus(Guid documentId, bool hasErrors)
    {
        SetStatus(documentId, hasErrors ? ValidationStatus.HasErrors : ValidationStatus.Valid);
    }

    /// <summary>
    /// Clears validation status for a document.
    /// </summary>
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