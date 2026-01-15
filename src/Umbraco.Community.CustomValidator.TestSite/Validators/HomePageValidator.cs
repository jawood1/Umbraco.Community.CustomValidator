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

        if (string.IsNullOrWhiteSpace(content.Title) || content.Title.Length <= 10)
        {
            messages.Add(new ValidationMessage
            {
                Message = "Title: The title must be longer than 10 characters.",
                Severity = ValidationSeverity.Error
            });
        }

        if (content.MainImage?.Content is not Image { AltText.Length: > 0 })
        {
            messages.Add(new ValidationMessage
            {
                Message = "Main Image: has no alt text.",
                Severity = ValidationSeverity.Warning
            });
        }

        // Example info message
        messages.Add(new ValidationMessage
        {
            Message = "Cool here is some info...",
            Severity = ValidationSeverity.Info
        });

        return Task.FromResult<IEnumerable<ValidationMessage>>(messages);
    }
}
