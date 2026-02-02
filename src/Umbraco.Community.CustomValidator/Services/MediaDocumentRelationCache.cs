namespace Umbraco.Community.CustomValidator.Services;

using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using Umbraco.Cms.Core.Services;

public sealed class MediaDocumentRelationCache(
    IRelationService relationService,
    HybridCache cache,
    ILogger<MediaDocumentRelationCache> logger)
{

    private const string RelationCacheKeyPrefix = "mediaDocRelations";

    private const int RelationCacheMinutes = 10;

    /// <summary>
    /// Gets document GUIDs that reference a media item, with caching.
    /// </summary>
    public async Task<List<int>> GetRelatedDocumentsAsync(
        int mediaId,
        CancellationToken cancellationToken = default)
    {
        var cacheKey = GetRelationCacheKey(mediaId);

        return await cache.GetOrCreateAsync(
            cacheKey, (ct) =>
            {
                var relatedDocs = QueryRelatedDocuments(mediaId);
                return ValueTask.FromResult(relatedDocs);
            },
            new HybridCacheEntryOptions
            {
                Expiration = TimeSpan.FromMinutes(RelationCacheMinutes),
                LocalCacheExpiration = TimeSpan.FromMinutes(RelationCacheMinutes),
                Flags = HybridCacheEntryFlags.DisableCompression
            },
            tags: GetRelationTags(mediaId),
            cancellationToken);
    }

    /// <summary>
    /// Clears cached media relations.
    /// </summary>
    public async Task ClearMediaRelationsAsync(int mediaId, CancellationToken cancellationToken = default)
    {
        await cache.RemoveByTagAsync(GetMediaRelationTag(mediaId), cancellationToken);
    }

    private List<int> QueryRelatedDocuments(int mediaId)
    {
        var relatedDocumentKeys = new List<int>();

        try
        {
            var relations = relationService.GetByChildId(mediaId, "umbMedia");

            foreach (var relation in relations)
            {
                if (relation.ParentObjectType == Umbraco.Cms.Core.Constants.ObjectTypes.Document)
                {
                    relatedDocumentKeys.Add(relation.ParentId);
                }
            }

            logger.LogDebug("Found {Count} document relations for media {MediaKey}",
                relatedDocumentKeys.Count, mediaId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error querying relations for media {MediaKey}", mediaId);
        }

        return relatedDocumentKeys;
    }

    private static string GetRelationCacheKey(int mediaKey) =>
        $"{RelationCacheKeyPrefix}_{mediaKey}";

    private static string[] GetRelationTags(int mediaKey) =>
        ["media-relations", GetMediaRelationTag(mediaKey)];

    private static string GetMediaRelationTag(int mediaKey) =>
        $"media-relations:media:{mediaKey}";
}
