using Umbraco.Cms.Web.Common.PublishedModels;
using Umbraco.Community.CustomValidator.Enums;
using Umbraco.Community.CustomValidator.Models;
using Umbraco.Community.CustomValidator.Validation;

namespace Umbraco.Community.CustomValidator.TestSite.Validators;

public class HomePageValidator() : BaseDocumentValidator<Home>
{
    public override Task<IEnumerable<ValidationMessage>> ValidateAsync(Home content)
    {
        var messages = new List<ValidationMessage>();

       if (!string.IsNullOrWhiteSpace(content.Title) && content.Title.Length < 10)
        {
            messages.Add(new ValidationMessage
            {
                Message = $"Title: is too short ({content.Title.Length} characters) minimum length 10 characters.",
                Severity = ValidationSeverity.Error
            });
        }

        if (content.MainImage?.Content is Image mainImage && string.IsNullOrWhiteSpace(mainImage.AltText))
        {
            messages.Add(new ValidationMessage
            {
                Message = "Main Image: missing alt text for accessibility.",
                Severity = ValidationSeverity.Warning
            });
        }

        if (string.IsNullOrWhiteSpace(content.MetaDescription))
        {
            messages.Add(new ValidationMessage
            {
                Message = "Meta description is recommended for SEO.",
                Severity = ValidationSeverity.Info
            });
        }

        return Task.FromResult<IEnumerable<ValidationMessage>>(messages);
    }
}
