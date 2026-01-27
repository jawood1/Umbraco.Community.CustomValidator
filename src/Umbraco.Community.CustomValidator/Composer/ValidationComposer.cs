using System.Diagnostics.CodeAnalysis;
using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Api.Management.Services.Flags;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Community.CustomValidator.Notifications;
using Umbraco.Community.CustomValidator.Services;
using Umbraco.Community.CustomValidator.Validation;

namespace Umbraco.Community.CustomValidator.Composer;

using Umbraco.Extensions;

[ExcludeFromCodeCoverage]
internal sealed class ValidationComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.Configure<CustomValidatorOptions>(builder.Config.GetSection(Constants.OptionsName));

        //services
        builder.Services.AddSingleton<CustomValidationCacheService>();
        builder.Services.AddSingleton<CustomValidationStatusCache>();
        builder.Services.AddSingleton<CustomValidatorRegistry>();
        builder.Services.AddSingleton<CustomValidationService>();

        //flags
        builder.FlagProviders()
            .Append<CustomValidationErrorFlagProvider>();

        //notifications
        builder.AddNotificationAsyncHandler<ContentSavingNotification, ContentValidationNotificationHandler>();
        builder.AddNotificationAsyncHandler<ContentPublishingNotification, ContentValidationNotificationHandler>();
    }
}
