using Moq;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Community.CustomValidator.Enums;
using Umbraco.Community.CustomValidator.Interfaces;
using Umbraco.Community.CustomValidator.Models;
using Umbraco.Community.CustomValidator.Validation;

namespace Umbraco.Community.CustomValidator.Tests.Validation;

[TestFixture]
public class BaseDocumentValidatorTests
{
    #region NameOfType Tests

    [Test]
    public void NameOfType_AutomaticallySetFromGenericType()
    {
        // Arrange & Act
        var validator = new TestHomePageValidator();

        // Assert
        Assert.That(validator.NameOfType, Is.EqualTo("IHomePage"));
    }

    [Test]
    public void NameOfType_CanBeOverridden()
    {
        // Arrange & Act
        var validator = new TestHomePageValidator { NameOfType = "CustomName" };

        // Assert
        Assert.That(validator.NameOfType, Is.EqualTo("CustomName"));
    }

    #endregion

    #region ValidateAsync - Generic Tests

    [Test]
    public async Task ValidateAsync_Generic_CallsImplementation()
    {
        // Arrange
        var validator = new TestHomePageValidator();
        var content = CreateMockContent<IHomePage>();

        // Act
        var result = await validator.ValidateAsync(content);

        // Assert
        Assert.That(result.Count(), Is.EqualTo(1));
        Assert.That(result.First().Message, Is.EqualTo("Test validation executed"));
    }

    [Test]
    public async Task ValidateAsync_Generic_PassesCorrectContent()
    {
        // Arrange
        var validator = new TestHomePageValidator();
        var contentMock = new Mock<IHomePage>();
        contentMock.Setup(x => x.Name).Returns("Test Page");

        // Act
        var result = await validator.ValidateAsync(contentMock.Object);

        // Assert
        Assert.That(validator.LastValidatedContent, Is.Not.Null);
        Assert.That(validator.LastValidatedContent!.Name, Is.EqualTo("Test Page"));
    }

    #endregion

    #region ValidateAsync - Non-Generic Tests

    [Test]
    public async Task ValidateAsync_NonGeneric_WithCorrectType_CallsGenericImplementation()
    {
        // Arrange
        var validator = new TestHomePageValidator();
        var content = CreateMockContent<IHomePage>();

        // Act
        var result = await validator.ValidateAsync((IPublishedContent)content);

        // Assert
        Assert.That(result.Count(), Is.EqualTo(1));
        Assert.That(result.First().Message, Is.EqualTo("Test validation executed"));
    }

    [Test]
    public async Task ValidateAsync_NonGeneric_WithWrongType_ReturnsTypeError()
    {
        // Arrange
        var validator = new TestHomePageValidator();
        var content = CreateMockContent<IArticlePage>(); // Wrong type

        // Act
        var result = await validator.ValidateAsync((IPublishedContent)content);

        // Assert
        Assert.That(result.Count(), Is.EqualTo(1));
        Assert.That(result.First().Message, Does.Contain("Content is not of expected type"));
        Assert.That(result.First().Message, Does.Contain("IHomePage"));
        Assert.That(result.First().Severity, Is.EqualTo(ValidationSeverity.Error));
    }

    [Test]
    public async Task ValidateAsync_NonGeneric_WithWrongType_DoesNotCallImplementation()
    {
        // Arrange
        var validator = new TestHomePageValidator();
        var content = CreateMockContent<IArticlePage>();

        // Act
        await validator.ValidateAsync((IPublishedContent)content);

        // Assert
        Assert.That(validator.LastValidatedContent, Is.Null,
            "Generic ValidateAsync should not be called with wrong type");
    }

    #endregion

    #region Interface Implementation Tests

    [Test]
    public void BaseDocumentValidator_ImplementsGenericInterface()
    {
        // Arrange
        var validator = new TestHomePageValidator();

        // Assert
        Assert.That(validator, Is.InstanceOf<IDocumentValidator<IHomePage>>());
    }

    [Test]
    public void BaseDocumentValidator_ImplementsNonGenericInterface()
    {
        // Arrange
        var validator = new TestHomePageValidator();

        // Assert
        Assert.That(validator, Is.InstanceOf<IDocumentValidator>());
    }

    #endregion

    #region Multiple Validation Messages Tests

    [Test]
    public async Task ValidateAsync_CanReturnMultipleMessages()
    {
        // Arrange
        var validator = new MultiMessageValidator();
        var content = CreateMockContent<IHomePage>();

        // Act
        var result = await validator.ValidateAsync(content);

        // Assert
        Assert.That(result.Count(), Is.EqualTo(3));
        Assert.That(result.Count(m => m.Severity == ValidationSeverity.Error), Is.EqualTo(1));
        Assert.That(result.Count(m => m.Severity == ValidationSeverity.Warning), Is.EqualTo(1));
        Assert.That(result.Count(m => m.Severity == ValidationSeverity.Info), Is.EqualTo(1));
    }

    [Test]
    public async Task ValidateAsync_CanReturnEmptyList()
    {
        // Arrange
        var validator = new EmptyValidator();
        var content = CreateMockContent<IHomePage>();

        // Act
        var result = await validator.ValidateAsync(content);

        // Assert
        Assert.That(result, Is.Empty);
    }

    #endregion

    #region Helper Methods

    private static T CreateMockContent<T>() where T : class, IPublishedContent
    {
        var mock = new Mock<T>();
        mock.Setup(x => x.Id).Returns(1);
        mock.Setup(x => x.Name).Returns("Mock Content");
        return mock.Object;
    }

    #endregion

    #region Test Validators

    private class TestHomePageValidator : BaseDocumentValidator<IHomePage>
    {
        public IHomePage? LastValidatedContent { get; private set; }

        public override Task<IEnumerable<ValidationMessage>> ValidateAsync(IHomePage content)
        {
            LastValidatedContent = content;

            return Task.FromResult<IEnumerable<ValidationMessage>>(new List<ValidationMessage>
            {
                new()
                {
                    Message = "Test validation executed",
                    Severity = ValidationSeverity.Info
                }
            });
        }
    }

    private class MultiMessageValidator : BaseDocumentValidator<IHomePage>
    {
        public override Task<IEnumerable<ValidationMessage>> ValidateAsync(IHomePage content)
        {
            return Task.FromResult<IEnumerable<ValidationMessage>>(new List<ValidationMessage>
            {
                new() { Message = "Error message", Severity = ValidationSeverity.Error },
                new() { Message = "Warning message", Severity = ValidationSeverity.Warning },
                new() { Message = "Info message", Severity = ValidationSeverity.Info }
            });
        }
    }

    private class EmptyValidator : BaseDocumentValidator<IHomePage>
    {
        public override Task<IEnumerable<ValidationMessage>> ValidateAsync(IHomePage content)
        {
            return Task.FromResult<IEnumerable<ValidationMessage>>(new List<ValidationMessage>());
        }
    }

    #endregion
}
