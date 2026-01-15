using Umbraco.Cms.Web.Common.PublishedModels;
using Umbraco.Community.CustomValidator.Enums;
using Umbraco.Community.CustomValidator.Models;
using Umbraco.Community.CustomValidator.Validation;

namespace Umbraco.Community.CustomValidator.TestSite.Validators;

public class ContentPageValidator() : BaseDocumentValidator<Content>(Content.ModelTypeAlias)
{
    public override Task<IEnumerable<ValidationMessage>> ValidateAsync(Content content)
    {
        var messages = new List<ValidationMessage>();

        // Example validation: Check if home page title is empty
        if (string.IsNullOrWhiteSpace(content.Title))
        {
            messages.Add(new ValidationMessage
            {
                Message = "Home page title cannot be empty",
                Severity = ValidationSeverity.Error
            });
        }

        if (content.Title?.Length < 3)
        {
            messages.Add(new ValidationMessage
            {
                Message = "Title can't be short",
                Severity = ValidationSeverity.Warning
            });
        }

        return Task.FromResult<IEnumerable<ValidationMessage>>(messages);
    }
}
