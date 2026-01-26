using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Community.CustomValidator.Enums;
using Umbraco.Community.CustomValidator.Interfaces;
using Umbraco.Community.CustomValidator.Models;
using Umbraco.Community.CustomValidator.Services;

namespace Umbraco.Community.CustomValidator.Tests.Validation;

using Umbraco.Community.CustomValidator.Validation;

[TestFixture]
public class CustomValidatorRegistryTests
{
    private ServiceCollection _services = null!;
    private ServiceProvider _serviceProvider = null!;
    private Mock<ILogger<CustomValidatorRegistry>> _loggerMock = null!;
    private CustomValidatorRegistry _sut = null!;

    [SetUp]
    public void Setup()
    {
        _services = new ServiceCollection();
        _loggerMock = new Mock<ILogger<CustomValidatorRegistry>>();

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
        _sut = new CustomValidatorRegistry(_serviceProvider, _loggerMock.Object);
        var content = CreateMockContent<IHomePage>();

        // Act
        var result = await _sut.ValidateAsync(content);

        // Assert
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task ValidateAsync_WithMatchingValidator_ExecutesValidation()
    {
        // Arrange - Use real validator instead of mock
        var validator = new TestHomePageValidator
        {
            MessagesToReturn = new List<ValidationMessage>
            {
                new() { Message = "Error 1", Severity = ValidationSeverity.Error }
            }
        };

        _services.AddSingleton(validator);
        _services.AddSingleton<IDocumentValidator>(sp => validator);

        _serviceProvider = _services.BuildServiceProvider();
        _sut = new CustomValidatorRegistry(_serviceProvider, _loggerMock.Object);
        var content = CreateMockContent<IHomePage>();

        // Act
        var result = await _sut.ValidateAsync(content);

        // Assert
        Assert.That(result.Count(), Is.EqualTo(1));
        Assert.That(result.First().Message, Is.EqualTo("Error 1"));
    }


    [Test]
    public async Task ValidateAsync_WithMultipleValidators_ExecutesAll()
    {
        // Arrange - Use real validators instead of mocks
        var validator1 = new TestHomePageValidator
        {
            MessagesToReturn = new List<ValidationMessage>
            {
                new() { Message = "Error 1", Severity = ValidationSeverity.Error }
            }
        };

        var validator2 = new TestHomePageValidator2
        {
            MessagesToReturn = new List<ValidationMessage>
            {
                new() { Message = "Warning 1", Severity = ValidationSeverity.Warning }
            }
        };

        _services.AddSingleton(validator1);
        _services.AddSingleton<IDocumentValidator>(sp => validator1);
        _services.AddSingleton(validator2);
        _services.AddSingleton<IDocumentValidator>(sp => validator2);

        _serviceProvider = _services.BuildServiceProvider();
        _sut = new CustomValidatorRegistry(_serviceProvider, _loggerMock.Object);
        var content = CreateMockContent<IHomePage>();

        // Act
        var result = await _sut.ValidateAsync(content);

        // Assert
        Assert.That(result.Count(), Is.EqualTo(2));
        Assert.That(result.Any(m => m.Message == "Error 1"), Is.True);
        Assert.That(result.Any(m => m.Message == "Warning 1"), Is.True);
    }

    private class TestHomePageValidator2 : IDocumentValidator
    {
        public string NameOfType => "IHomePage";
        public List<ValidationMessage> MessagesToReturn { get; set; } = new();

        public Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
        {
            return Task.FromResult<IEnumerable<ValidationMessage>>(MessagesToReturn);
        }
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
        _sut = new CustomValidatorRegistry(_serviceProvider, _loggerMock.Object);
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
        _sut = new CustomValidatorRegistry(_serviceProvider, _loggerMock.Object);
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
        var validator = new TestInterfaceValidator();

        _services.AddSingleton(validator);
        _services.AddSingleton<IDocumentValidator>(sp => validator);

        _serviceProvider = _services.BuildServiceProvider();
        _sut = new CustomValidatorRegistry(_serviceProvider, _loggerMock.Object);

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
        _sut = new CustomValidatorRegistry(_serviceProvider, _loggerMock.Object);
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
        _sut = new CustomValidatorRegistry(_serviceProvider, _loggerMock.Object);
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
        _sut = new CustomValidatorRegistry(_serviceProvider, _loggerMock.Object);
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
        _sut = new CustomValidatorRegistry(_serviceProvider, _loggerMock.Object);
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
        _sut = new CustomValidatorRegistry(_serviceProvider, _loggerMock.Object);
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
        _sut = new CustomValidatorRegistry(_serviceProvider, _loggerMock.Object);
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

        // Register a factory that creates a new validator each time and increments counter
        _services.AddScoped<TestValidator>(sp =>
        {
            callCount++;
            return new TestValidator();
        });
        _services.AddScoped<IDocumentValidator>(sp => sp.GetRequiredService<TestValidator>());

        _serviceProvider = _services.BuildServiceProvider();

        // Act - Create two scopes
        using (var scope1 = _serviceProvider.CreateScope())
        {
            var sut1 = new CustomValidatorRegistry(scope1.ServiceProvider, _loggerMock.Object);
            var content = CreateMockContent<IHomePage>();
            await sut1.ValidateAsync(content);
        }

        using (var scope2 = _serviceProvider.CreateScope())
        {
            var sut2 = new CustomValidatorRegistry(scope2.ServiceProvider, _loggerMock.Object);
            var content = CreateMockContent<IHomePage>();
            await sut2.ValidateAsync(content);
        }

        // Assert - Should have been called twice (different scopes = different instances)
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
        _sut = new CustomValidatorRegistry(_serviceProvider, _loggerMock.Object);
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
        _sut = new CustomValidatorRegistry(_serviceProvider, _loggerMock.Object);

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

    private class TestHomePageValidator : IDocumentValidator
    {
        public string NameOfType => "IHomePage";
        public List<ValidationMessage> MessagesToReturn { get; set; } = new();

        public Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
        {
            return Task.FromResult<IEnumerable<ValidationMessage>>(MessagesToReturn);
        }
    }

    private class TestInterfaceValidator : IDocumentValidator
    {
        public string NameOfType => "IBasePage";

        public Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
        {
            return Task.FromResult<IEnumerable<ValidationMessage>>(new List<ValidationMessage>
            {
                new() { Message = "Interface validation", Severity = ValidationSeverity.Info }
            });
        }
    }

    #endregion
}
