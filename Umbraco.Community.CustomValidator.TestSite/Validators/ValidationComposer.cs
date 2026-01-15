using Umbraco.Cms.Core.Composing;
using Umbraco.Community.CustomValidator.Validation;

namespace Umbraco.Community.CustomValidator.TestSite.Validators;

public class ValidationComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        // Register all validators
        builder.Services.AddSingleton<IDocumentValidator, HomePageValidator>();
        builder.Services.AddSingleton<IDocumentValidator, ContentPageValidator>();
    }
}
