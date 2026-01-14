using Umbraco.Cms.Core.Models.PublishedContent;

namespace MyProject.Validation;

public class ValidationMessage
{
    public required string Message { get; set; }
    public ValidationSeverity Severity { get; set; }
    public string? PropertyAlias { get; set; }
}

public enum ValidationSeverity
{
    Info,
    Warning,
    Error
}

public interface IDocumentValidator<T> where T : IPublishedContent
{
    Task<IEnumerable<ValidationMessage>> ValidateAsync(T content);
}

public interface IDocumentValidator
{
    string ContentTypeAlias { get; }
    Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content);
}
