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
    IVariationContextAccessor variationContextAccessor)
    : INotificationAsyncHandler<ContentPublishingNotification>
{
    private readonly IUmbracoContext _umbracoContext = umbracoContextAccessor.GetRequiredUmbracoContext();

    public async Task HandleAsync(ContentPublishingNotification notification, CancellationToken cancellationToken)
    {
        var errorCount = 0;

        foreach (var entity in notification.PublishedEntities)
        {
            var publishedContent = _umbracoContext.Content?.GetById(true, entity.Id);

            if (publishedContent == null || !validationService.HasValidator(publishedContent))
                continue;

            var savingCultures = entity.AvailableCultures
                .Where(culture => notification.IsPublishingCulture(entity, culture)).ToList();

            if(savingCultures is not { Count: > 0 })
                continue;

            foreach (var culture in savingCultures)
            {
                variationContextAccessor.VariationContext = new VariationContext(culture);

                var validationMessages = await validationService.ValidateAsync(publishedContent);
                var errors = validationMessages.Count(m => m.Severity == ValidationSeverity.Error);
                errorCount += errors;
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
}
