using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Community.CustomValidator.Notifications;

namespace Umbraco.Community.CustomValidator.Composer;

using Umbraco.Community.CustomValidator.Services;
using Umbraco.Community.CustomValidator.Validation;

internal sealed class ValidationComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.AddTransient<ValidationCacheService>();
        builder.Services.AddSingleton<DocumentValidationService>();
        builder.AddNotificationAsyncHandler<ContentSavingNotification, ContentValidationNotificationHandler>();
        builder.AddNotificationAsyncHandler<ContentPublishingNotification, ContentValidationNotificationHandler>();
    }
}
