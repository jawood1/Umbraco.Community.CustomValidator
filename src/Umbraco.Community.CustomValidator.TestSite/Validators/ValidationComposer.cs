using Umbraco.Cms.Core.Composing;
using Umbraco.Community.CustomValidator.Extensions;

namespace Umbraco.Community.CustomValidator.TestSite.Validators;

using Umbraco.Cms.Web.Common.PublishedModels;

public class ValidationComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.AddDocumentValidator<HomePageValidator, Home>();
        builder.AddDocumentValidator<ContentPageValidator, Content>();
        builder.AddDocumentValidator<HeaderControlsValidator, IHeaderControls>();
        builder.AddScopedDocumentValidator<ScopedValidatorTest, XMlsitemap>();
        builder.AddTransientDocumentValidator<TransientValidatorTest, Article>();
    }
}