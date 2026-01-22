using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Community.CustomValidator.Enums;
using Umbraco.Community.CustomValidator.Interfaces;
using Umbraco.Community.CustomValidator.Models;
using Umbraco.Community.CustomValidator.Validation;

namespace Umbraco.Community.CustomValidator.Tests.Validation;

public interface IHomePage : IPublishedContent { }
public interface IBasePage { }
public interface IHomePageWithBase : IPublishedContent, IBasePage { }

[TestFixture]
public class DocumentValidationServiceTests
{
    private ServiceCollection _services = null!;
    private ServiceProvider _serviceProvider = null!;
    private Mock<ILogger<DocumentValidationService>> _loggerMock = null!;
    private DocumentValidationService _sut = null!;

    [SetUp]
    public void Setup()
    {
        _services = new ServiceCollection();
        _loggerMock = new Mock<ILogger<DocumentValidationService>>();

        // Register logger
        _services.AddSingleton(_loggerMock.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _serviceProvider?.Dispose();
    }

    #region ValidateAsync Tests

    [Test]
    public async Task ValidateAsync_WithNoValidators_ReturnsEmptyList()
    {
        // Arrange
        _serviceProvider = _services.BuildServiceProvider();
        _sut = new DocumentValidationService(_serviceProvider, _loggerMock.Object);
        var content = CreateMockContent<IHomePage>();

        // Act
        var result = await _sut.ValidateAsync(content);

        // Assert
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task ValidateAsync_WithMatchingValidator_ExecutesValidation()
    {
        // Arrange
        var validatorMock = new Mock<IDocumentValidator>();
        validatorMock.Setup(v => v.NameOfType).Returns("IHomePage");
        validatorMock.Setup(v => v.ValidateAsync(It.IsAny<IPublishedContent>()))
            .ReturnsAsync(new List<ValidationMessage>
            {
                new() { Message = "Error 1", Severity = ValidationSeverity.Error }
            });

        _services.AddSingleton(validatorMock.Object);
        _services.AddSingleton<IDocumentValidator>(sp => validatorMock.Object);

        _serviceProvider = _services.BuildServiceProvider();
        _sut = new DocumentValidationService(_serviceProvider, _loggerMock.Object);
        var content = CreateMockContent<IHomePage>();

        // Act
        var result = await _sut.ValidateAsync(content);

        // Assert
        Assert.That(result.Count(), Is.EqualTo(1));
        Assert.That(result.First().Message, Is.EqualTo("Error 1"));
        validatorMock.Verify(v => v.ValidateAsync(It.IsAny<IPublishedContent>()), Times.Once);
    }

    [Test]
    public async Task ValidateAsync_WithMultipleValidators_ExecutesAll()
    {
        // Arrange
        var validator1Mock = new Mock<IDocumentValidator>();
        validator1Mock.Setup(v => v.NameOfType).Returns("IHomePage");
        validator1Mock.Setup(v => v.ValidateAsync(It.IsAny<IPublishedContent>()))
            .ReturnsAsync(new List<ValidationMessage>
            {
                new() { Message = "Error 1", Severity = ValidationSeverity.Error }
            });

        var validator2Mock = new Mock<IDocumentValidator>();
        validator2Mock.Setup(v => v.NameOfType).Returns("IHomePage");
        validator2Mock.Setup(v => v.ValidateAsync(It.IsAny<IPublishedContent>()))
            .ReturnsAsync(new List<ValidationMessage>
            {
                new() { Message = "Warning 1", Severity = ValidationSeverity.Warning }
            });

        _services.AddSingleton(validator1Mock.Object);
        _services.AddSingleton<IDocumentValidator>(sp => validator1Mock.Object);
        _services.AddSingleton(validator2Mock.Object);
        _services.AddSingleton<IDocumentValidator>(sp => validator2Mock.Object);

        _serviceProvider = _services.BuildServiceProvider();
        _sut = new DocumentValidationService(_serviceProvider, _loggerMock.Object);
        var content = CreateMockContent<IHomePage>();

        // Act
        var result = await _sut.ValidateAsync(content);

        // Assert
        Assert.That(result.Count(), Is.EqualTo(2));
        Assert.That(result.Any(m => m.Message == "Error 1"), Is.True);
        Assert.That(result.Any(m => m.Message == "Warning 1"), Is.True);
    }

    [Test]
    public async Task ValidateAsync_ValidatorThrowsException_ReturnsErrorMessage()
    {
        // Arrange
        var validatorMock = new Mock<IDocumentValidator>();
        validatorMock.Setup(v => v.NameOfType).Returns("IHomePage");
        validatorMock.Setup(v => v.ValidateAsync(It.IsAny<IPublishedContent>()))
            .ThrowsAsync(new InvalidOperationException("Test exception"));

        _services.AddSingleton(validatorMock.Object);
        _services.AddSingleton<IDocumentValidator>(sp => validatorMock.Object);

        _serviceProvider = _services.BuildServiceProvider();
        _sut = new DocumentValidationService(_serviceProvider, _loggerMock.Object);
        var content = CreateMockContent<IHomePage>();

        // Act
        var result = await _sut.ValidateAsync(content);

        // Assert
        Assert.That(result.Count(), Is.EqualTo(1));
        Assert.That(result.First().Message, Does.Contain("error occurred"));
        Assert.That(result.First().Severity, Is.EqualTo(ValidationSeverity.Error));
    }

    [Test]
    public async Task ValidateAsync_ValidatorThrowsException_LogsError()
    {
        // Arrange
        var validatorMock = new Mock<IDocumentValidator>();
        validatorMock.Setup(v => v.NameOfType).Returns("IHomePage");
        validatorMock.Setup(v => v.ValidateAsync(It.IsAny<IPublishedContent>()))
            .ThrowsAsync(new InvalidOperationException("Test exception"));

        _services.AddSingleton(validatorMock.Object);
        _services.AddSingleton<IDocumentValidator>(sp => validatorMock.Object);

        _serviceProvider = _services.BuildServiceProvider();
        _sut = new DocumentValidationService(_serviceProvider, _loggerMock.Object);
        var content = CreateMockContent<IHomePage>();

        // Act
        await _sut.ValidateAsync(content);

        // Assert
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => true),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public async Task ValidateAsync_WithInterfaceMatch_ExecutesValidator()
    {
        // Arrange - Validator targets interface, content implements it
        var validatorMock = new Mock<IDocumentValidator>();
        validatorMock.Setup(v => v.NameOfType).Returns("IBasePage");
        validatorMock.Setup(v => v.ValidateAsync(It.IsAny<IPublishedContent>()))
            .ReturnsAsync(new List<ValidationMessage>
            {
                new() { Message = "Interface validation", Severity = ValidationSeverity.Info }
            });

        _services.AddSingleton(validatorMock.Object);
        _services.AddSingleton<IDocumentValidator>(sp => validatorMock.Object);

        _serviceProvider = _services.BuildServiceProvider();
        _sut = new DocumentValidationService(_serviceProvider, _loggerMock.Object);

        // Use the combined interface
        var content = CreateMockContent<IHomePageWithBase>();

        // Act
        var result = await _sut.ValidateAsync(content);

        // Assert
        Assert.That(result.Count(), Is.EqualTo(1));
        Assert.That(result.First().Message, Is.EqualTo("Interface validation"));
    }

    [Test]
    public async Task ValidateAsync_CachesValidatorTypeMapping()
    {
        // Arrange
        var validatorMock = new Mock<IDocumentValidator>();
        validatorMock.Setup(v => v.NameOfType).Returns("IHomePage");
        validatorMock.Setup(v => v.ValidateAsync(It.IsAny<IPublishedContent>()))
            .ReturnsAsync(new List<ValidationMessage>());

        _services.AddSingleton(validatorMock.Object);
        _services.AddSingleton<IDocumentValidator>(sp => validatorMock.Object);

        _serviceProvider = _services.BuildServiceProvider();
        _sut = new DocumentValidationService(_serviceProvider, _loggerMock.Object);
        var content = CreateMockContent<IHomePage>();

        // Act - Call twice
        await _sut.ValidateAsync(content);
        await _sut.ValidateAsync(content);

        // Assert - Should log discovery only once (cached)
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Debug,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Discovered")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region HasValidator Tests

    [Test]
    public void HasValidator_WithNoValidators_ReturnsFalse()
    {
        // Arrange
        _serviceProvider = _services.BuildServiceProvider();
        _sut = new DocumentValidationService(_serviceProvider, _loggerMock.Object);
        var content = CreateMockContent<IHomePage>();

        // Act
        var result = _sut.HasValidator(content);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public void HasValidator_WithMatchingValidator_ReturnsTrue()
    {
        // Arrange
        var validatorMock = new Mock<IDocumentValidator>();
        validatorMock.Setup(v => v.NameOfType).Returns("IHomePage");

        _services.AddSingleton(validatorMock.Object);
        _services.AddSingleton<IDocumentValidator>(sp => validatorMock.Object);

        _serviceProvider = _services.BuildServiceProvider();
        _sut = new DocumentValidationService(_serviceProvider, _loggerMock.Object);
        var content = CreateMockContent<IHomePage>();

        // Act
        var result = _sut.HasValidator(content);

        // Assert
        Assert.That(result, Is.True);
    }

    [Test]
    public void HasValidator_WithNonMatchingValidator_ReturnsFalse()
    {
        // Arrange
        var validatorMock = new Mock<IDocumentValidator>();
        validatorMock.Setup(v => v.NameOfType).Returns("IArticlePage");

        _services.AddSingleton(validatorMock.Object);
        _services.AddSingleton<IDocumentValidator>(sp => validatorMock.Object);

        _serviceProvider = _services.BuildServiceProvider();
        _sut = new DocumentValidationService(_serviceProvider, _loggerMock.Object);
        var content = CreateMockContent<IHomePage>();

        // Act
        var result = _sut.HasValidator(content);

        // Assert
        Assert.That(result, Is.False);
    }

    [Test]
    public void HasValidator_WithInterfaceMatch_ReturnsTrue()
    {
        // Arrange
        var validatorMock = new Mock<IDocumentValidator>();
        validatorMock.Setup(v => v.NameOfType).Returns("IBasePage");

        _services.AddSingleton(validatorMock.Object);
        _services.AddSingleton<IDocumentValidator>(sp => validatorMock.Object);

        _serviceProvider = _services.BuildServiceProvider();
        _sut = new DocumentValidationService(_serviceProvider, _loggerMock.Object);
        var content = CreateMockContentWithInterface<IHomePageWithBase, IBasePage>();

        // Act
        var result = _sut.HasValidator(content);

        // Assert
        Assert.That(result, Is.True);
    }

    #endregion

    #region ClearValidatorCache Tests

    [Test]
    public void ClearValidatorCache_ClearsTypeCache()
    {
        // Arrange
        var validatorMock = new Mock<IDocumentValidator>();
        validatorMock.Setup(v => v.NameOfType).Returns("IHomePage");

        _services.AddSingleton(validatorMock.Object);
        _services.AddSingleton<IDocumentValidator>(sp => validatorMock.Object);

        _serviceProvider = _services.BuildServiceProvider();
        _sut = new DocumentValidationService(_serviceProvider, _loggerMock.Object);
        var content = CreateMockContent<IHomePage>();

        // Prime the cache
        _sut.HasValidator(content);

        // Act
        _sut.ClearValidatorCache();
        _sut.HasValidator(content); // This should trigger discovery again

        // Assert - Should log discovery twice (once before clear, once after)
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Debug,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Discovered")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Exactly(2));
    }

    #endregion

    #region Service Lifetime Tests

    [Test]
    public async Task ValidateAsync_WithScopedValidator_CreatesNewInstancePerScope()
    {
        // Arrange
        var callCount = 0;
        var validatorMock = new Mock<IDocumentValidator>();
        validatorMock.Setup(v => v.NameOfType).Returns("IHomePage");
        validatorMock.Setup(v => v.ValidateAsync(It.IsAny<IPublishedContent>()))
            .ReturnsAsync(() =>
            {
                callCount++;
                return new List<ValidationMessage>();
            });

        // Register as scoped
        _services.AddScoped<TestValidator>();
        _services.AddScoped<IDocumentValidator>(sp => sp.GetRequiredService<TestValidator>());

        _serviceProvider = _services.BuildServiceProvider();

        // Act - Create two scopes
        using (var scope1 = _serviceProvider.CreateScope())
        {
            var sut1 = new DocumentValidationService(scope1.ServiceProvider, _loggerMock.Object);
            var content = CreateMockContent<IHomePage>();
            await sut1.ValidateAsync(content);
        }

        using (var scope2 = _serviceProvider.CreateScope())
        {
            var sut2 = new DocumentValidationService(scope2.ServiceProvider, _loggerMock.Object);
            var content = CreateMockContent<IHomePage>();
            await sut2.ValidateAsync(content);
        }

        // Assert - Should have been called twice (different instances)
        Assert.That(callCount, Is.EqualTo(2));
    }

    [Test]
    public async Task ValidateAsync_WithSingletonValidator_ReusesSameInstance()
    {
        // Arrange
        var validator = new TestValidator();

        _services.AddSingleton<TestValidator>(validator);
        _services.AddSingleton<IDocumentValidator>(sp => sp.GetRequiredService<TestValidator>());

        _serviceProvider = _services.BuildServiceProvider();
        _sut = new DocumentValidationService(_serviceProvider, _loggerMock.Object);
        var content = CreateMockContent<IHomePage>();

        // Act
        await _sut.ValidateAsync(content);
        await _sut.ValidateAsync(content);

        // Assert
        Assert.That(validator.CallCount, Is.EqualTo(2));
    }

    #endregion

    #region Concurrent Access Tests

    [Test]
    public async Task ValidateAsync_ConcurrentCalls_ThreadSafe()
    {
        // Arrange
        var validatorMock = new Mock<IDocumentValidator>();
        validatorMock.Setup(v => v.NameOfType).Returns("IHomePage");
        validatorMock.Setup(v => v.ValidateAsync(It.IsAny<IPublishedContent>()))
            .ReturnsAsync(new List<ValidationMessage>
            {
                new() { Message = "Test", Severity = ValidationSeverity.Info }
            });

        _services.AddSingleton(validatorMock.Object);
        _services.AddSingleton<IDocumentValidator>(sp => validatorMock.Object);

        _serviceProvider = _services.BuildServiceProvider();
        _sut = new DocumentValidationService(_serviceProvider, _loggerMock.Object);

        // Act - Concurrent validations
        var tasks = Enumerable.Range(0, 10).Select(_ =>
        {
            var content = CreateMockContent<IHomePage>();
            return _sut.ValidateAsync(content);
        }).ToArray();

        // Assert - Should not throw
        Assert.DoesNotThrowAsync(async () => await Task.WhenAll(tasks));
    }

    #endregion

    #region Helper Methods and Classes

    private static T CreateMockContent<T>() where T : class, IPublishedContent
    {
        var mock = new Mock<T>();
        mock.Setup(c => c.Id).Returns(1);
        return mock.Object;
    }

    private static T CreateMockContentWithInterface<T, TInterface>()
        where T : class, IPublishedContent, TInterface
        where TInterface : class
    {
        var mock = new Mock<T>();
        mock.Setup(c => c.Id).Returns(1);
        mock.As<TInterface>();
        return mock.Object;
    }

    // Test validator for lifetime tests
    private class TestValidator : IDocumentValidator
    {
        public int CallCount { get; private set; }
        public string NameOfType => "IHomePage";

        public Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
        {
            CallCount++;
            return Task.FromResult<IEnumerable<ValidationMessage>>(new List<ValidationMessage>());
        }
    }

    #endregion
}
