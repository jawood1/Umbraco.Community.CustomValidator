using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Community.CustomValidator.Notifications;
using Umbraco.Community.CustomValidator.Validation;

namespace Umbraco.Community.CustomValidator;

public class ValidationComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.AddSingleton<DocumentValidationService>();
        builder.AddNotificationAsyncHandler<ContentPublishingNotification, ContentPublishingValidationHandler>();
    }
}
