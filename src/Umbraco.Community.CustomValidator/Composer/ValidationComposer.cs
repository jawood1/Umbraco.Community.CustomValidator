using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Community.CustomValidator.Notifications;
using Umbraco.Community.CustomValidator.Services;
using System.Diagnostics.CodeAnalysis;
using Umbraco.Community.CustomValidator.Validation;

namespace Umbraco.Community.CustomValidator.Composer;

[ExcludeFromCodeCoverage]
internal sealed class ValidationComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.Configure<CustomValidatorOptions>(builder.Config.GetSection(Constants.OptionsName));

        //services
        builder.Services.AddSingleton<ValidatorLookup>();
        builder.Services.AddSingleton<CustomValidatorRegistry>();
        builder.Services.AddSingleton<CustomValidationService>();
        builder.Services.AddSingleton<CustomValidationCacheService>();

        //notifications
        builder.AddNotificationAsyncHandler<ContentSavingNotification, ContentValidationNotificationHandler>();
        builder.AddNotificationAsyncHandler<ContentPublishingNotification, ContentValidationNotificationHandler>();
    }
}
