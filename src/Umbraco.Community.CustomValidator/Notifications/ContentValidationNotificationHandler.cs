using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Web;
using Umbraco.Community.CustomValidator.Enums;
using Umbraco.Community.CustomValidator.Models;
using Umbraco.Community.CustomValidator.Services;
using Umbraco.Community.CustomValidator.Validation;
using Umbraco.Extensions;

namespace Umbraco.Community.CustomValidator.Notifications;

public sealed class ContentValidationNotificationHandler(
    IUmbracoContextAccessor umbracoContextAccessor,
    CustomValidationCacheService cacheService,
    CustomValidationService validationExecutor,
    IOptions<CustomValidatorOptions> options,
    ILogger<ContentValidationNotificationHandler> logger)
    :   INotificationAsyncHandler<ContentSavingNotification>,
        INotificationAsyncHandler<ContentPublishingNotification>
{

    /// <summary>
    /// Clears the validation cache for affected documents and cultures.
    /// </summary>
    public async Task HandleAsync(ContentSavingNotification notification, CancellationToken cancellationToken)
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
                    await cacheService.ClearForDocumentCultureAsync(entity.Key, culture, cancellationToken);
                }
            }
            else
            {
                logger.LogDebug("Clearing validation cache for invariant document {DocumentId} ({Name})",
                    entity.Key, entity.Name);

                await cacheService.ClearForDocumentCultureAsync(entity.Key, null, cancellationToken);
            }
        }
    }

    /// <summary>
    /// Validates publishing entities and cancels the publish operation if validation errors are found.
    /// </summary>
    public async Task HandleAsync(ContentPublishingNotification notification, CancellationToken cancellationToken)
    {
        try
        {
            var umbracoContext = umbracoContextAccessor.GetRequiredUmbracoContext();

            foreach (var entity in notification.PublishedEntities)
            {

                var content = umbracoContext.Content.GetById(preview: true, entity.Key);

                if (content == null)
                {
                    continue;
                }

                var publishingCultures = entity.AvailableCultures
                    .Where(culture => notification.IsPublishingCulture(entity, culture))
                    .ToList();

                (bool hasErrors, string errorMessage) = await ValidateDocumentAsync(content, publishingCultures, cancellationToken);

                if (!hasErrors)
                    continue;

                notification.CancelOperation(new EventMessage(
                    "Custom Validation Failed",
                    errorMessage,
                    EventMessageType.Error
                ));

                return;
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Custom Validator: Unexpected error during publish validation");

            notification.CancelOperation(new EventMessage(
                "Custom Validation Failed",
                "Cannot publish: an unexpected error occurred. Please check the logs.",
                EventMessageType.Error
            ));
        }
    }

    private async Task<(bool HasErrors, string ErrorMessage)> ValidateDocumentAsync(
        IPublishedContent content,
        List<string> cultures,
        CancellationToken cancellationToken)
    {
        if (cultures.Count > 0)
        {
            // Variant content - validate each culture
            foreach (var culture in cultures)
            {
                var response = await validationExecutor.ExecuteValidationAsync(content, culture, cancellationToken);

                if (!HasValidationErrors(response))
                    continue;

                var cultureErrors = CountErrors(response);
                return (true, $"Cannot publish '{content.Name}' (culture: {culture}): {cultureErrors} validation error(s) found.");
            }
        }
        else
        {
            // Invariant content
            var response = await validationExecutor.ExecuteValidationAsync(content, null, cancellationToken);

            if (!HasValidationErrors(response))
                return (false, string.Empty);

            int errorCount = CountErrors(response);
            return (true, $"Cannot publish '{content.Name}': {errorCount} validation error(s) found.");
        }

        return (false, string.Empty);
    }

    private bool HasValidationErrors(ValidationResponse response)
    {
        return response is { HasValidator: true, Messages: not null } &&
               response.Messages.Any(m => IsError(m.Severity));
    }

    private bool IsError(ValidationSeverity severity)
    {
        return options.Value.TreatWarningsAsErrors
            ? severity == ValidationSeverity.Error || severity == ValidationSeverity.Warning
            : severity == ValidationSeverity.Error;
    }

    private int CountErrors(ValidationResponse response)
    {
        return response.Messages?.Count(m => IsError(m.Severity)) ?? 0;
    }
}
