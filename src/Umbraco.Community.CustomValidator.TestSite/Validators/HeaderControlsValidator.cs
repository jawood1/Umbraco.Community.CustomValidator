using Umbraco.Cms.Web.Common.PublishedModels;
using Umbraco.Community.CustomValidator.Enums;
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
            messages.Add(new ValidationMessage
            {
                Message = "Subtitle empty",
                Severity = ValidationSeverity.Error
            });
        }

        return Task.FromResult<IEnumerable<ValidationMessage>>(messages);
    }
}