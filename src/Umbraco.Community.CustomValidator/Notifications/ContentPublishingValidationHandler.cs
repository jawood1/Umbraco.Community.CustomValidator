using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Web;
using Umbraco.Community.CustomValidator.Enums;
using Umbraco.Community.CustomValidator.Validation;
using Umbraco.Extensions;

namespace Umbraco.Community.CustomValidator.Notifications;

internal sealed class ContentPublishingValidationHandler(
    DocumentValidationService validationService,
    IUmbracoContextAccessor umbracoContextAccessor,
    IVariationContextAccessor variationContextAccessor,
    ILogger<ContentPublishingValidationHandler> logger)
    : INotificationAsyncHandler<ContentPublishingNotification>
{
    private readonly IUmbracoContext _umbracoContext = umbracoContextAccessor.GetRequiredUmbracoContext();

    public async Task HandleAsync(ContentPublishingNotification notification, CancellationToken cancellationToken)
    {
        try
        {
            var errorCount = 0;

            foreach (var entity in notification.PublishedEntities)
            {
                var publishedContent = _umbracoContext.Content?.GetById(true, entity.Id);

                if (publishedContent == null || !validationService.HasValidator(publishedContent))
                    continue;

                var savingCultures = entity.AvailableCultures
                    .Where(culture => notification.IsPublishingCulture(entity, culture)).ToList();

                if (savingCultures is { Count: > 0 })
                {
                    errorCount += await ValidateByCulture(publishedContent, savingCultures);
                }
                else
                {
                    errorCount += await GetErrorCount(publishedContent);
                }
            }

            if (errorCount > 0)
            {
                // Cancel the publish operation
                notification.CancelOperation(new EventMessage(
                    "Custom Validation Failed",
                    $"Cannot publish: {errorCount} validation error(s) found on document.",
                    EventMessageType.Error
                ));
            }

        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unexpected error attempting to publish while validating document");

            notification.CancelOperation(new EventMessage(
                "Custom Validation Failed",
                "Cannot publish: an unexpected error occured. Please check the logs.",
                EventMessageType.Error
            ));
        }
    }

    private async Task<int> ValidateByCulture(IPublishedContent publishedContent, List<string> cultures)
    {
        var errorCount = 0;

        foreach (var culture in cultures)
        {
            variationContextAccessor.VariationContext = new VariationContext(culture);
            errorCount += await GetErrorCount(publishedContent);
        }

        return errorCount;
    }

    private async Task<int> GetErrorCount(IPublishedContent publishedContent)
    {
        var validationMessages = await validationService.ValidateAsync(publishedContent);
        return validationMessages.Count(m => m.Severity == ValidationSeverity.Error);
    }
}
