namespace Umbraco.Community.CustomValidator.TestSite.Validators;

using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Web.Common.PublishedModels;
using Umbraco.Community.CustomValidator.Models;
using Umbraco.Community.CustomValidator.Validation;

public class ScopedValidatorTest(IContentService contentService) : BaseDocumentValidator<XMlsitemap>
{

    public override Task<IEnumerable<ValidationMessage>> ValidateAsync(XMlsitemap content)
    {

        var test = contentService.GetById(content.Id);

        return Task.FromResult<IEnumerable<ValidationMessage>>([]);
    }
}
