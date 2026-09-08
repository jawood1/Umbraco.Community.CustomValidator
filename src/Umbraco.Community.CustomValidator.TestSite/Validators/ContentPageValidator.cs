using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Web.Common.PublishedModels;
using Umbraco.Community.CustomValidator.Enums;
using Umbraco.Community.CustomValidator.Models;
using Umbraco.Community.CustomValidator.Validation;

namespace Umbraco.Community.CustomValidator.TestSite.Validators;

public class ContentPageValidator() : BaseDocumentValidator<Content>
{
    public override Task<IEnumerable<ValidationMessage>> ValidateAsync(Content content)
    {
        var messages = new List<ValidationMessage>();

        if (string.IsNullOrWhiteSpace(content.Title))
        {
            messages.Add(new ValidationMessage
            {
                Message = "Title cannot be empty",
                Severity = ValidationSeverity.Warning,
                PropertyAlias = "title"
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
