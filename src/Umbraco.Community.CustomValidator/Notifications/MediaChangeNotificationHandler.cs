using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Community.CustomValidator.Services;

namespace Umbraco.Community.CustomValidator.Notifications;

/// <summary>
/// Handles media change notifications to clear validation cache for documents that reference the media.
/// </summary>
public sealed class MediaChangeNotificationHandler(
    MediaDocumentRelationCache relationCache,
    CustomValidationCacheService validationCacheService,
    ILogger<MediaChangeNotificationHandler> logger)
    : INotificationAsyncHandler<MediaSavedNotification>, 
        INotificationAsyncHandler<MediaDeletedNotification>
{
    private readonly MediaDocumentRelationCache _relationCache =
        relationCache ?? throw new ArgumentNullException(nameof(relationCache));

    private readonly CustomValidationCacheService _validationCacheService =
        validationCacheService ?? throw new ArgumentNullException(nameof(validationCacheService));

    private readonly ILogger<MediaChangeNotificationHandler> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task HandleAsync(MediaSavedNotification notification, CancellationToken cancellationToken)
    {
        await ClearRelatedDocumentCachesAsync(notification.SavedEntities, "saved", cancellationToken);

        foreach (var media in notification.SavedEntities)
        {
            await _relationCache.ClearMediaRelationsAsync(media.Id, cancellationToken);
        }
    }

    public async Task HandleAsync(MediaDeletedNotification notification, CancellationToken cancellationToken)
    {
        await ClearRelatedDocumentCachesAsync(notification.DeletedEntities, "deleted", cancellationToken);

        // Clear relation cache for deleted media
        foreach (var media in notification.DeletedEntities)
        {
            await _relationCache.ClearMediaRelationsAsync(media.Id, cancellationToken);
        }
    }

    /// <summary>
    /// Shared logic: Clears validation cache for all documents related to the changed media items.
    /// </summary>
    private async Task ClearRelatedDocumentCachesAsync(
        IEnumerable<IMedia> mediaItems,
        string action,
        CancellationToken cancellationToken)
    {
        var mediaList = mediaItems.ToList();

        if (mediaList.Count == 0)
        {
            return;
        }

        var allRelatedDocuments = new HashSet<int>();

        foreach (var media in mediaList)
        {
            var relatedDocuments = await _relationCache.GetRelatedDocumentsAsync(media.Id, cancellationToken);

            foreach (var docId in relatedDocuments)
            {
                allRelatedDocuments.Add(docId);
            }
        }

        if (allRelatedDocuments.Count == 0)
        {
            _logger.LogDebug("No related documents found for {Action} media items", action);
            return;
        }

        _logger.LogInformation(
            "Clearing validation cache for {DocumentCount} documents affected by {MediaCount} {Action} media item(s)",
            allRelatedDocuments.Count, mediaList.Count, action);

        // Clear validation cache for all unique related documents
        foreach (var documentKey in allRelatedDocuments)
        {
            await _validationCacheService.ClearForDocumentAsync(documentKey, cancellationToken);
        }
    }
}