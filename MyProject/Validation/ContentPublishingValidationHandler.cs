using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Web;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace MyProject.Validation;

public class ContentPublishingValidationHandler : INotificationAsyncHandler<ContentPublishingNotification>
{
    private readonly DocumentValidationService _validationService;

    private readonly IUmbracoContext _umbracoContext;

    private readonly IVariationContextAccessor _variationContextAccessor;

    public ContentPublishingValidationHandler(
        DocumentValidationService validationService, 
        IUmbracoContextAccessor umbracoContextAccessor, 
        IVariationContextAccessor variationContextAccessor)
    {
        _validationService = validationService;
        _variationContextAccessor = variationContextAccessor;
        _umbracoContext = umbracoContextAccessor.GetRequiredUmbracoContext();
    }

    public async Task HandleAsync(ContentPublishingNotification notification, CancellationToken cancellationToken)
    {
        foreach (var entity in notification.PublishedEntities)
        {
            // Check if there's a validator for this content type
            if (!_validationService.HasValidator(entity.ContentType.Alias))
            {
                continue;
            }

            var savingCultures = entity.AvailableCultures
                .Where(culture => notification.IsPublishingCulture(entity, culture)).ToList();

            if(savingCultures is not { Count: > 0 })
                continue;

            var errorCount = 0;

            foreach (var culture in savingCultures)
            {
                var publishedContent = _umbracoContext.Content?.GetById(true, entity.Id);

                if (publishedContent == null)
                    continue;

                _variationContextAccessor.VariationContext = new VariationContext(culture);

                var validationMessages = await _validationService.ValidateAsync(publishedContent);
                var errors = validationMessages.Count(m => m.Severity == ValidationSeverity.Error);
                errorCount += errors;
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
}
