using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Community.CustomValidator.Enums;
using Umbraco.Community.CustomValidator.Interfaces;
using Umbraco.Community.CustomValidator.Models;

namespace Umbraco.Community.CustomValidator.Validation;

/// <summary>
/// Provides a base class for implementing document validators for a specific content type.
/// </summary>
/// <remarks>This abstract class defines the contract for validating documents of type <typeparamref name="TContent"/>.
/// Implementers should provide validation logic by overriding <see cref="ValidateAsync(TContent)"/>. The class also provides a
/// non-generic validation method for compatibility with non-generic consumers.</remarks>
/// <typeparam name="TContent">The type of content to validate. Must implement <see cref="IPublishedContent"/>.</typeparam>
public abstract class BaseDocumentValidator<TContent> : IDocumentValidator<TContent>
    where TContent : class, IPublishedContent
{

    public abstract Task<IEnumerable<ValidationMessage>> ValidateAsync(TContent content);

    public async Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
    {
        if (content is not TContent typedContent)
        {
            return
            [
                new ValidationMessage
                {
                    Message = $"Content is not of expected type {typeof(TContent).Name}",
                    Severity = ValidationSeverity.Error
                }
            ];
        }

        return await ValidateAsync(typedContent);
    }
}
