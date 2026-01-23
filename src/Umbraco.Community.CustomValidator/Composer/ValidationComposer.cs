using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Community.CustomValidator.Notifications;
using Umbraco.Community.CustomValidator.Services;
using Umbraco.Community.CustomValidator.Validation;
using System.Diagnostics.CodeAnalysis;

namespace Umbraco.Community.CustomValidator.Composer;

[ExcludeFromCodeCoverage]
internal sealed class ValidationComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.Configure<CustomValidatorOptions>(builder.Config.GetSection(Constants.OptionsName));
        builder.Services.AddTransient<ValidationCacheService>();
        builder.Services.AddSingleton<DocumentValidationService>();
        builder.AddNotificationAsyncHandler<ContentSavingNotification, ContentValidationNotificationHandler>();
        builder.AddNotificationAsyncHandler<ContentPublishingNotification, ContentValidationNotificationHandler>();
    }
}
