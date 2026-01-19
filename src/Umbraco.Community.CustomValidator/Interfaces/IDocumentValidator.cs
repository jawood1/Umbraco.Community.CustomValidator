using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Community.CustomValidator.Models;

namespace Umbraco.Community.CustomValidator.Interfaces;

public interface IDocumentValidator<T> where T : class, IPublishedContent
{
    Task<IEnumerable<ValidationMessage>> ValidateAsync(T content);
}

public interface IDocumentValidator
{
    string NameOfType { get; }

    Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content);
}