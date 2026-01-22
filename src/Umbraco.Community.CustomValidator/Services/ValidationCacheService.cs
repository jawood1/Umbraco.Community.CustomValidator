using System.Collections.Concurrent;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Umbraco.Community.CustomValidator.Models;

namespace Umbraco.Community.CustomValidator.Services;

public sealed class ValidationCacheService(
    IMemoryCache cache, 
    ILogger<ValidationCacheService> logger)
{
    private readonly ConcurrentDictionary<Guid, ConcurrentBag<string>> _documentCacheKeys = new();

    private const int CacheExpirationMinutes = 30;
    private const string CacheKeyPrefix = "customValidation";

    /// <summary>
    /// Attempts to retrieve a cached validation result.
    /// </summary>
    /// <param name="documentId">The document identifier.</param>
    /// <param name="culture">The culture code. Null for invariant content.</param>
    /// <param name="result">The cached validation result if found.</param>
    /// <returns>True if a cached result was found, false otherwise.</returns>
    public bool TryGetCached(Guid documentId, string? culture, out ValidationResponse? result)
    {
        var cacheKey = GetCacheKey(documentId, culture);

        if (cache.TryGetValue(cacheKey, out ValidationResponse? cachedResult))
        {
            logger.LogDebug("Cache HIT: {CacheKey} (culture: {Culture})",
                cacheKey, culture ?? "invariant");

            result = cachedResult;
            return true;
        }

        logger.LogDebug("Cache MISS: {CacheKey} (culture: {Culture})",
            cacheKey, culture ?? "invariant");

        result = null;
        return false;
    }

    /// <summary>
    /// Caches a validation result.
    /// </summary>
    /// <param name="documentId">The document identifier.</param>
    /// <param name="culture">The culture code. Null for invariant content.</param>
    /// <param name="response">The validation response to cache.</param>
    public void SetCache(Guid documentId, string? culture, ValidationResponse response)
    {
        if (response == null) throw new ArgumentNullException(nameof(response));

        var cacheKey = GetCacheKey(documentId, culture);

        var cacheOptions = new MemoryCacheEntryOptions()
            .SetAbsoluteExpiration(TimeSpan.FromMinutes(CacheExpirationMinutes))
            .SetPriority(CacheItemPriority.Normal)
            .RegisterPostEvictionCallback(OnCacheEntryEvicted);

        cache.Set(cacheKey, response, cacheOptions);
        TrackCacheKey(documentId, cacheKey);

        logger.LogDebug("Cached: {CacheKey} (culture: {Culture})",
            cacheKey, culture ?? "invariant");
    }

    /// <summary>
    /// Clears cached validation result for a specific document and culture.
    /// </summary>
    /// <param name="documentId">The document identifier.</param>
    /// <param name="culture">The culture code. Null for invariant content.</param>
    public void ClearForDocumentCulture(Guid documentId, string? culture)
    {
        var cacheKey = GetCacheKey(documentId, culture);
        cache.Remove(cacheKey);
        RemoveCacheKeyTracking(documentId, cacheKey);

        logger.LogDebug("Cleared cache: {CacheKey} (culture: {Culture})",
            cacheKey, culture ?? "invariant");
    }

    /// <summary>
    /// Clears all cached validation results for a document (all cultures).
    /// </summary>
    /// <param name="documentId">The document identifier.</param>
    public void ClearForDocument(Guid documentId)
    {
        if (_documentCacheKeys.TryRemove(documentId, out var cacheKeys))
        {
            var keysList = cacheKeys.ToList();
            foreach (var cacheKey in keysList)
            {
                cache.Remove(cacheKey);
            }

            logger.LogInformation("Cleared all validation cache for document {DocumentId} ({Count} entries)",
                documentId, keysList.Count);
        }
        else
        {
            logger.LogDebug("No cache entries found for document {DocumentId}", documentId);
        }
    }

    /// <summary>
    /// Clears all cached validation results.
    /// </summary>
    public void ClearAll()
    {
        var allDocumentIds = _documentCacheKeys.Keys.ToList();

        foreach (var documentId in allDocumentIds)
        {
            ClearForDocument(documentId);
        }

        _documentCacheKeys.Clear();

        logger.LogInformation("Cleared all validation cache ({Count} documents)", allDocumentIds.Count);
    }

    #region Private Methods

    private void TrackCacheKey(Guid documentId, string cacheKey)
    {
        _documentCacheKeys.AddOrUpdate(
            documentId,
            _ => new ConcurrentBag<string> { cacheKey },
            (_, existingKeys) =>
            {
                if (!existingKeys.Contains(cacheKey))
                {
                    existingKeys.Add(cacheKey);
                }
                return existingKeys;
            });
    }

    private void RemoveCacheKeyTracking(Guid documentId, string cacheKey)
    {
        if (_documentCacheKeys.TryGetValue(documentId, out var keys))
        {
            var updatedKeys = new ConcurrentBag<string>(keys.Where(k => k != cacheKey));

            if (updatedKeys.IsEmpty)
            {
                _documentCacheKeys.TryRemove(documentId, out _);
            }
            else
            {
                _documentCacheKeys.TryUpdate(documentId, updatedKeys, keys);
            }
        }
    }

    private void OnCacheEntryEvicted(object key, object? value, EvictionReason reason, object? state)
    {
        if (key is string cacheKey && TryExtractDocumentIdFromCacheKey(cacheKey, out var documentId))
        {
            RemoveCacheKeyTracking(documentId, cacheKey);
            logger.LogTrace("Cache entry evicted: {CacheKey}, reason: {Reason}", cacheKey, reason);
        }
    }

    /// <summary>
    /// Generates a cache key for a document.
    /// </summary>
    private static string GetCacheKey(Guid documentId, string? culture) => $"{CacheKeyPrefix}_{documentId}_{culture}";

    private static bool TryExtractDocumentIdFromCacheKey(string cacheKey, out Guid documentId)
    {
        var parts = cacheKey.Split('_');

        if (parts.Length >= 2 && Guid.TryParse(parts[1], out var parsedId))
        {
            documentId = parsedId;
            return true;
        }

        documentId = Guid.Empty;
        return false;
    }

    #endregion
}