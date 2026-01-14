using Umbraco.Cms.Web.Common.PublishedModels;

namespace MyProject.Validation.Validators;

public class HomePageValidator : BaseDocumentValidator<Home>
{
    public HomePageValidator() : base(Home.ModelTypeAlias)
    {
    }

    public override Task<IEnumerable<ValidationMessage>> ValidateAsync(Home content)
    {
        var messages = new List<ValidationMessage>();

        // Example validation: Check if home page title is empty
        if (string.IsNullOrWhiteSpace(content.Name))
        {
            messages.Add(new ValidationMessage
            {
                Message = "Home page title cannot be empty",
                Severity = ValidationSeverity.Error,
                PropertyAlias = "name"
            });
        }

        // Example validation: Check if name is too short
        if (!string.IsNullOrWhiteSpace(content.Name) && content.Name.Length < 3)
        {
            messages.Add(new ValidationMessage
            {
                Message = "Home page title should be at least 3 characters long",
                Severity = ValidationSeverity.Error,
                PropertyAlias = "name"
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
