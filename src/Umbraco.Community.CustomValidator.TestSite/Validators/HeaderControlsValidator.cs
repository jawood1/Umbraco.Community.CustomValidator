using Umbraco.Cms.Web.Common.PublishedModels;
using Umbraco.Community.CustomValidator.Extensions;
using Umbraco.Community.CustomValidator.Models;
using Umbraco.Community.CustomValidator.Validation;

namespace Umbraco.Community.CustomValidator.TestSite.Validators;

public class HeaderControlsValidator : BaseDocumentValidator<IHeaderControls>
{
    public override Task<IEnumerable<ValidationMessage>> ValidateAsync(IHeaderControls content)
    {
        var messages = new List<ValidationMessage>();

        if (string.IsNullOrWhiteSpace(content.Subtitle))
        {
            messages.AddWarning<IHeaderControls>("Subtitle empty", x => x.Subtitle);
        }

        if (string.IsNullOrWhiteSpace(content.Subtitle) && !string.IsNullOrWhiteSpace(content.Title))
        {
            messages.AddError<IHeaderControls>(
                "Title requires a Subtitle to also be set",
                x => x.Title,
                x => x.Subtitle);
        }

        return Task.FromResult<IEnumerable<ValidationMessage>>(messages);
    }
}