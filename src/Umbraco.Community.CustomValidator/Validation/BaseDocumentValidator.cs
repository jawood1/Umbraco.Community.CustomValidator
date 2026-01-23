using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Community.CustomValidator.Enums;
using Umbraco.Community.CustomValidator.Interfaces;
using Umbraco.Community.CustomValidator.Models;

namespace Umbraco.Community.CustomValidator.Validation;

/// <summary>
/// Provides a base class for implementing document validators for a specific content type.
/// </summary>
/// <remarks>This abstract class defines the contract for validating documents of type <typeparamref name="T"/>.
/// Implementers should provide validation logic by overriding <see cref="ValidateAsync(T)"/>. The class also provides a
/// non-generic validation method for compatibility with non-generic consumers.</remarks>
/// <typeparam name="T">The type of content to validate. Must implement <see cref="IPublishedContent"/>.</typeparam>
public abstract class BaseDocumentValidator<T> : IDocumentValidator<T>, IDocumentValidator
    where T : class, IPublishedContent
{
    public string NameOfType { get; init; } = typeof(T).Name;

    public abstract Task<IEnumerable<ValidationMessage>> ValidateAsync(T content);

    public async Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
    {
        if (content is not T typedContent)
        {
            return
            [
                new ValidationMessage
                {
                    Message = $"Content is not of expected type {typeof(T).Name}",
                    Severity = ValidationSeverity.Error
                }
            ];
        }

        return await ValidateAsync(typedContent);
    }
}
