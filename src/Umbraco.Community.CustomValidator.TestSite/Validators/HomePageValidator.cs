using Umbraco.Cms.Core.Models.PublishedContent;
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
                Severity = ValidationSeverity.Error,
                PropertyAlias = "title"
            });
        }

        if(!string.IsNullOrWhiteSpace(content.Title) && content.Title.Contains("z"))
        {
            messages.Add(new ValidationMessage
            {
                Message = $"ANOTHER ERROR",
                Severity = ValidationSeverity.Error,
                PropertyAlias = "title"
            });
        }

        if (content.MainImage?.Content is Image mainImage && string.IsNullOrWhiteSpace(mainImage.AltText))
        {
            messages.Add(new ValidationMessage
            {
                Message = "Main Image: missing alt text for accessibility.",
                Severity = ValidationSeverity.Warning,
                PropertyAlias = "mainImage"
            });
        }

        if (string.IsNullOrWhiteSpace(content.MetaDescription))
        {
            messages.Add(new ValidationMessage
            {
                Message = "Meta description is recommended for SEO.",
                Severity = ValidationSeverity.Warning,
                PropertyAlias = "metaDescription"
            });
        }

        if(content.ContentRows?.Count > 1)
        {
             messages.Add(new ValidationMessage
            {
                Message = $"More than 1 content row",
                Severity = ValidationSeverity.Error,
                PropertyAlias = "contentRows",
            });
        }

        return Task.FromResult<IEnumerable<ValidationMessage>>(messages);
    }
}
