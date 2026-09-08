using System.Linq.Expressions;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Community.CustomValidator.Enums;
using Umbraco.Community.CustomValidator.Models;

namespace Umbraco.Community.CustomValidator.Extensions;

/// <summary>
/// Dev-friendly, strongly-typed helpers for building up a validator's message list, avoiding
/// hand-typed property alias strings. Each method constructs a <see cref="ValidationMessage"/>
/// and adds it directly to the collection, e.g.:
/// <code>
/// var messages = new List&lt;ValidationMessage&gt;();
/// messages.AddWarning&lt;IHeaderControls&gt;("Subtitle empty", x => x.Subtitle);
/// messages.AddError&lt;IHeaderControls&gt;(
///     "Title requires a Subtitle to also be set",
///     x => x.Title,
///     x => x.Subtitle);
/// </code>
/// </summary>
public static class ValidationMessageCollectionExtensions
{
    extension(ICollection<ValidationMessage> messages)
    {
        /// <summary>Adds an Error-severity message tied to <paramref name="property"/> (and any <paramref name="relatedProperties"/>).</summary>
        public ICollection<ValidationMessage> AddError<TContent>(
            string message,
            Expression<Func<TContent, object>> property,
            params Expression<Func<TContent, object>>[] relatedProperties)
            where TContent : IPublishedContent
            => messages.AddTyped(message, ValidationSeverity.Error, property, relatedProperties);

        /// <summary>Adds a Warning-severity message tied to <paramref name="property"/> (and any <paramref name="relatedProperties"/>).</summary>
        public ICollection<ValidationMessage> AddWarning<TContent>(
            string message,
            Expression<Func<TContent, object>> property,
            params Expression<Func<TContent, object>>[] relatedProperties)
            where TContent : IPublishedContent
            => messages.AddTyped(message, ValidationSeverity.Warning, property, relatedProperties);

        /// <summary>Adds an Info-severity message tied to <paramref name="property"/> (and any <paramref name="relatedProperties"/>).</summary>
        public ICollection<ValidationMessage> AddInfo<TContent>(
            string message,
            Expression<Func<TContent, object>> property,
            params Expression<Func<TContent, object>>[] relatedProperties)
            where TContent : IPublishedContent
            => messages.AddTyped(message, ValidationSeverity.Info, property, relatedProperties);

        /// <summary>Adds a document-level Error-severity message with no associated property alias.</summary>
        public ICollection<ValidationMessage> AddError(string message) =>
            messages.AddPlain(message, ValidationSeverity.Error);

        /// <summary>Adds a document-level Warning-severity message with no associated property alias.</summary>
        public ICollection<ValidationMessage> AddWarning(string message) =>
            messages.AddPlain(message, ValidationSeverity.Warning);

        /// <summary>Adds a document-level Info-severity message with no associated property alias.</summary>
        public ICollection<ValidationMessage> AddInfo(string message) =>
            messages.AddPlain(message, ValidationSeverity.Info);

        private ICollection<ValidationMessage> AddTyped<TContent>(
            string message,
            ValidationSeverity severity,
            Expression<Func<TContent, object>> property,
            Expression<Func<TContent, object>>[] relatedProperties)
            where TContent : IPublishedContent
        {
            messages.Add(new ValidationMessage
            {
                Message = message,
                Severity = severity,
                PropertyAlias = PropertyAliasResolver.Resolve(property),
                RelatedPropertyAliases = relatedProperties.Length > 0
                    ? relatedProperties.Select(PropertyAliasResolver.Resolve).ToArray()
                    : null
            });

            return messages;
        }

        private ICollection<ValidationMessage> AddPlain(string message, ValidationSeverity severity)
        {
            messages.Add(new ValidationMessage
            {
                Message = message,
                Severity = severity
            });

            return messages;
        }
    }
}
