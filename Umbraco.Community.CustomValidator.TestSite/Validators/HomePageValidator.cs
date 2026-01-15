using Umbraco.Cms.Web.Common.PublishedModels;
using Umbraco.Community.CustomValidator.Enums;
using Umbraco.Community.CustomValidator.Models;
using Umbraco.Community.CustomValidator.Validation;

namespace Umbraco.Community.CustomValidator.TestSite.Validators;

public class HomePageValidator() : BaseDocumentValidator<Home>(Home.ModelTypeAlias)
{
    public override Task<IEnumerable<ValidationMessage>> ValidateAsync(Home content)
    {
        var messages = new List<ValidationMessage>();

        // Example validation: Check if home page title is empty
        if (string.IsNullOrWhiteSpace(content.Name))
        {
            messages.Add(new ValidationMessage
            {
                Message = "Home page title cannot be empty",
                Severity = ValidationSeverity.Error
            });
        }

        if (content.MainImage?.Content is not Image { AltText.Length: > 0 })
        {
            messages.Add(new ValidationMessage
            {
                Message = "Main Image: no alt text",
                Severity = ValidationSeverity.Warning
            });
        }

        // Example validation: Check if name is too short
        if (!string.IsNullOrWhiteSpace(content.Name) && content.Name.Length < 3)
        {
            messages.Add(new ValidationMessage
            {
                Message = "Home page title should be at least 3 characters long",
                Severity = ValidationSeverity.Error
            });
        }

        // Example info message
        messages.Add(new ValidationMessage
        {
            Message = "Home page validation completed successfully",
            Severity = ValidationSeverity.Info
        });

        return Task.FromResult<IEnumerable<ValidationMessage>>(messages);
    }
}
