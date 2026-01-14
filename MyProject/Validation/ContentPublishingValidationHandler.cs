using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Web;

namespace MyProject.Validation;

public class ContentPublishingValidationHandler : INotificationAsyncHandler<ContentPublishingNotification>
{
    private readonly DocumentValidationService _validationService;

    private readonly IUmbracoContextAccessor _umbracoContextAccessor;

    public ContentPublishingValidationHandler(
        DocumentValidationService validationService, 
        IUmbracoContextAccessor umbracoContextAccessor)
    {
        _validationService = validationService;
        _umbracoContextAccessor = umbracoContextAccessor;
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

            // Get the preview/draft version of the content being published
            var context = _umbracoContextAccessor.GetRequiredUmbracoContext();
            var publishedContent = context.Content?.GetById(true, entity.Id);

            if (publishedContent == null)
            {
                continue;
            }

            // Run validation
            var validationMessages = await _validationService.ValidateAsync(publishedContent);
            var errors = validationMessages.Where(m => m.Severity == ValidationSeverity.Error).ToList();

            if (errors.Any())
            {
                // Cancel the publish operation
                notification.CancelOperation(new EventMessage(
                    "Validation Failed",
                    $"Cannot publish '{entity.Name}': {errors.Count} validation error(s) found.",
                    EventMessageType.Error
                ));

                // Add individual error messages
                foreach (var error in errors)
                {
                    notification.Messages.Add(new EventMessage(
                        "Validation Error",
                        error.Message,
                        EventMessageType.Error
                    ));
                }
            }
        }
    }
}
