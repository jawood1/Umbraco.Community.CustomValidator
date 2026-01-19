using Umbraco.Cms.Core.Composing;
using Umbraco.Community.CustomValidator.Extensions;

namespace Umbraco.Community.CustomValidator.TestSite.Validators;

public class ValidationComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.AddDocumentValidator<HomePageValidator>();
        builder.AddDocumentValidator<ContentPageValidator>();
        builder.AddDocumentValidator<HeaderControlsValidator>();
    }
}