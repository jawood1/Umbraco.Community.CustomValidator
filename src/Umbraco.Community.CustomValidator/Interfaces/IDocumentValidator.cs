using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Community.CustomValidator.Models;

namespace Umbraco.Community.CustomValidator.Interfaces;

public interface IDocumentValidator<TContent> : IDocumentValidator
    where TContent : class, IPublishedContent
{
    Task<IEnumerable<ValidationMessage>> ValidateAsync(TContent content);
}

public interface IDocumentValidator
{
    Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content);
}