using MyProject.Validation;
using MyProject.Validation.Validators;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.Notifications;

namespace MyProject;

public class ValidationComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        // Register the validation service
        builder.Services.AddSingleton<DocumentValidationService>();

        // Register all validators
        builder.Services.AddSingleton<IDocumentValidator, HomePageValidator>();
        
        // Add more validators here as needed:
        // builder.Services.AddSingleton<IDocumentValidator, ArticleValidator>();
        // builder.Services.AddSingleton<IDocumentValidator, AuthorValidator>();

        // Register notification handler to block publish on validation errors
        builder.AddNotificationAsyncHandler<ContentPublishingNotification, ContentPublishingValidationHandler>();
    }
}
