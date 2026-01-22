using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Web;
using Umbraco.Community.CustomValidator.Enums;
using Umbraco.Extensions;
using Umbraco.Community.CustomValidator.Services;
using Umbraco.Community.CustomValidator.Validation;

namespace Umbraco.Community.CustomValidator.Notifications;

using Umbraco.Community.CustomValidator.Models;

internal sealed class ContentValidationNotificationHandler(
    ValidationCacheService cacheService,
    DocumentValidationService validationService,
    IUmbracoContextAccessor umbracoContextAccessor,
    IVariationContextAccessor variationContextAccessor,
    ILogger<ContentValidationNotificationHandler> logger)
    :   INotificationAsyncHandler<ContentSavingNotification>,
        INotificationAsyncHandler<ContentPublishingNotification>
{

    /// <summary>
    /// Clears the validation cache for affected documents and cultures.
    /// </summary>
    public Task HandleAsync(ContentSavingNotification notification, CancellationToken cancellationToken)
    {
        foreach (var entity in notification.SavedEntities)
        {
            var savingCultures = entity.AvailableCultures
                .Where(culture => notification.IsSavingCulture(entity, culture))
                .ToList();

            if (savingCultures.Count > 0)
            {
                foreach (var culture in savingCultures)
                {
                    logger.LogDebug("Clearing validation cache for document {DocumentId} ({Name}), culture: {Culture}",
                        entity.Key, entity.Name, culture);
                    cacheService.ClearForDocumentCulture(entity.Key, culture);
                }
            }
            else
            {
                logger.LogDebug("Clearing validation cache for invariant document {DocumentId} ({Name})",
                    entity.Key, entity.Name);

                cacheService.ClearForDocumentCulture(entity.Key, null);
            }
        }

        return Task.CompletedTask;
    }

    /// <summary>
    /// Validates publishing entities and cancels the publish operation if validation errors are found.
    /// </summary>
    public async Task HandleAsync(ContentPublishingNotification notification, CancellationToken cancellationToken)
    {
        try
        {
            var umbracoContext = umbracoContextAccessor.GetRequiredUmbracoContext();
            var errorCount = 0;

            foreach (var entity in notification.PublishedEntities)
            {
                var publishedContent = umbracoContext.Content?.GetById(true, entity.Id);
                if (publishedContent == null || !validationService.HasValidator(publishedContent))
                    continue;

                var publishingCultures = entity.AvailableCultures
                    .Where(culture => notification.IsPublishingCulture(entity, culture))
                    .ToList();

                errorCount += await ValidateAndCacheDocument(publishedContent, publishingCultures);
            }

            if (errorCount > 0)
            {
                notification.CancelOperation(new EventMessage(
                    "Custom Validation Failed",
                    $"Cannot publish: {errorCount} validation error(s) found.",
                    EventMessageType.Error
                ));
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unexpected error during publish validation");
            notification.CancelOperation(new EventMessage(
                "Custom Validation Failed",
                "Cannot publish: an unexpected error occurred. Please check the logs.",
                EventMessageType.Error
            ));
        }
    }

    /// <summary>
    /// Validates a document for specific cultures (or invariant) and caches the results.
    /// </summary>
    /// <param name="publishedContent">The content to validate</param>
    /// <param name="cultures">List of cultures to validate. Empty list means invariant content.</param>
    /// <returns>Total count of validation errors</returns>
    private async Task<int> ValidateAndCacheDocument(IPublishedContent publishedContent, List<string> cultures)
    {
        var errorCount = 0;

        if (cultures.Count > 0)
        {
            // Validate each culture
            foreach (var culture in cultures)
            {
                variationContextAccessor.VariationContext = new VariationContext(culture);
                var messages = await validationService.ValidateAsync(publishedContent);

                cacheService.SetCache(publishedContent.Key, culture, new ValidationResponse
                {
                    ContentId = publishedContent.Key,
                    HasValidator = true,
                    Messages = messages
                });

                errorCount += messages.Count(m => m.Severity == ValidationSeverity.Error);
            }
        }
        else
        {
            // Invariant content
            var messages = await validationService.ValidateAsync(publishedContent);

            cacheService.SetCache(publishedContent.Key, null, new ValidationResponse
            {
                ContentId = publishedContent.Key,
                HasValidator = true,
                Messages = messages
            });

            errorCount += messages.Count(m => m.Severity == ValidationSeverity.Error);
        }

        return errorCount;
    }
}
