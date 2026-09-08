using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Community.CustomValidator.Enums;
using Umbraco.Community.CustomValidator.Extensions;
using Umbraco.Community.CustomValidator.Models;

namespace Umbraco.Community.CustomValidator.Tests.Extensions;

[TestFixture]
public sealed class ValidationMessageCollectionExtensionsTests
{
    // Only used as a generic type witness in property-selector expressions below - never
    // instantiated, since the extension methods only inspect the expression tree.
    private interface ITestContent : IPublishedContent
    {
        string Title { get; }

        string Subtitle { get; }

        bool IsFeatured { get; }
    }

    [Test]
    public void AddError_AddsSingleMessage_WithResolvedPropertyAlias()
    {
        var messages = new List<ValidationMessage>();

        messages.AddError<ITestContent>("Title is required", x => x.Title);

        Assert.That(messages, Has.Count.EqualTo(1));
        Assert.That(messages[0].Message, Is.EqualTo("Title is required"));
        Assert.That(messages[0].Severity, Is.EqualTo(ValidationSeverity.Error));
        Assert.That(messages[0].PropertyAlias, Is.EqualTo("title"));
        Assert.That(messages[0].RelatedPropertyAliases, Is.Null);
    }

    [Test]
    public void AddWarning_AddsSingleMessage_WithResolvedPropertyAlias()
    {
        var messages = new List<ValidationMessage>();

        messages.AddWarning<ITestContent>("Subtitle empty", x => x.Subtitle);

        Assert.That(messages, Has.Count.EqualTo(1));
        Assert.That(messages[0].Severity, Is.EqualTo(ValidationSeverity.Warning));
        Assert.That(messages[0].PropertyAlias, Is.EqualTo("subtitle"));
    }

    [Test]
    public void AddInfo_AddsSingleMessage_WithResolvedPropertyAlias()
    {
        var messages = new List<ValidationMessage>();

        messages.AddInfo<ITestContent>("FYI", x => x.IsFeatured);

        Assert.That(messages, Has.Count.EqualTo(1));
        Assert.That(messages[0].Severity, Is.EqualTo(ValidationSeverity.Info));
        Assert.That(messages[0].PropertyAlias, Is.EqualTo("isFeatured"));
    }

    [Test]
    public void AddError_WithRelatedProperties_ResolvesAllAliases()
    {
        var messages = new List<ValidationMessage>();

        messages.AddError<ITestContent>(
            "Title requires a Subtitle to also be set",
            x => x.Title,
            x => x.Subtitle);

        Assert.That(messages[0].PropertyAlias, Is.EqualTo("title"));
        Assert.That(messages[0].RelatedPropertyAliases, Is.Not.Null);
        Assert.That(messages[0].RelatedPropertyAliases, Is.EqualTo(new[] { "subtitle" }));
    }

    [Test]
    public void AddError_NonGenericOverload_AddsDocumentLevelMessage_WithNoPropertyAlias()
    {
        var messages = new List<ValidationMessage>();

        messages.AddError("Document-level failure");

        Assert.That(messages, Has.Count.EqualTo(1));
        Assert.That(messages[0].Severity, Is.EqualTo(ValidationSeverity.Error));
        Assert.That(messages[0].PropertyAlias, Is.Null);
        Assert.That(messages[0].RelatedPropertyAliases, Is.Null);
    }

    [Test]
    public void AddWarning_NonGenericOverload_AddsDocumentLevelMessage()
    {
        var messages = new List<ValidationMessage>();

        messages.AddWarning("Document-level warning");

        Assert.That(messages[0].Severity, Is.EqualTo(ValidationSeverity.Warning));
        Assert.That(messages[0].PropertyAlias, Is.Null);
    }

    [Test]
    public void AddInfo_NonGenericOverload_AddsDocumentLevelMessage()
    {
        var messages = new List<ValidationMessage>();

        messages.AddInfo("Document-level info");

        Assert.That(messages[0].Severity, Is.EqualTo(ValidationSeverity.Info));
        Assert.That(messages[0].PropertyAlias, Is.Null);
    }

    [Test]
    public void Calls_CanBeChained_AndAccumulateInOrder()
    {
        var messages = new List<ValidationMessage>();

        messages
            .AddError<ITestContent>("Title required", x => x.Title)
            .AddWarning<ITestContent>("Subtitle empty", x => x.Subtitle)
            .AddInfo("Document-level note");

        Assert.That(messages, Has.Count.EqualTo(3));
        Assert.That(messages[0].Severity, Is.EqualTo(ValidationSeverity.Error));
        Assert.That(messages[1].Severity, Is.EqualTo(ValidationSeverity.Warning));
        Assert.That(messages[2].Severity, Is.EqualTo(ValidationSeverity.Info));
    }
}
