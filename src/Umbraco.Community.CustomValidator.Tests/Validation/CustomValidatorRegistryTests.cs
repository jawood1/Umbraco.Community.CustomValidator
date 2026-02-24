using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Community.CustomValidator.Enums;
using Umbraco.Community.CustomValidator.Interfaces;
using Umbraco.Community.CustomValidator.Models;
using Umbraco.Community.CustomValidator.Validation;

namespace Umbraco.Community.CustomValidator.Tests.Validation;

[TestFixture]
public sealed class CustomValidatorRegistryTests
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
    }

    [TearDown]
    public void TearDown()
    {
        _serviceProvider?.Dispose();
    }

    #region Constructor Tests

    [Test]
    public void Constructor_WithValidDependencies_CreatesInstance()
    {
        // Arrange
        _serviceProvider = _services.BuildServiceProvider();
        var scopeFactory = _serviceProvider.GetRequiredService<IServiceScopeFactory>();

        var logger = new Mock<ILogger<ValidatorLookup>>();
        var lookup = new ValidatorLookup([], logger.Object);

        // Act
        var registry = new CustomValidatorRegistry(
            scopeFactory,
            lookup,
            _loggerMock.Object);

        // Assert
        Assert.That(registry, Is.Not.Null);
    }

    #endregion

    #region ValidateAsync Tests - No Validators

    [Test]
    public async Task ValidateAsync_WithNoValidators_ReturnsEmptyList()
    {
        // Arrange
        _serviceProvider = _services.BuildServiceProvider();
        _sut = CreateRegistry(new List<ValidatorMetadata>());
        var content = CreateMockContent<IHomePage>();

        // Act
        var result = await _sut.ValidateAsync(content);

        // Assert
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task ValidateAsync_WithNoMatchingValidator_ReturnsEmptyList()
    {
        // Arrange
        var metadata = new List<ValidatorMetadata>
        {
            new() { ValidatorType = typeof(TestValidator1), ContentType = typeof(IArticle) }
        };

        RegisterValidator<TestValidator1>();
        _serviceProvider = _services.BuildServiceProvider();
        _sut = CreateRegistry(metadata);

        var content = CreateMockContent<IHomePage>(); // Different type

        // Act
        var result = await _sut.ValidateAsync(content);

        // Assert
        Assert.That(result, Is.Empty);
    }

    #endregion

    #region ValidateAsync Tests - With Validators

    [Test]
    public async Task ValidateAsync_WithMatchingValidator_ExecutesValidation()
    {
        // Arrange
        var metadata = new List<ValidatorMetadata>
        {
            new() { ValidatorType = typeof(TestValidator1), ContentType = typeof(IHomePage) }
        };

        RegisterValidator<TestValidator1>();
        _serviceProvider = _services.BuildServiceProvider();
        _sut = CreateRegistry(metadata);

        var content = CreateMockContent<IHomePage>();

        // Act
        var result = await _sut.ValidateAsync(content);

        // Assert
        Assert.That(result.Count(), Is.EqualTo(1));
        Assert.That(result.First().Message, Is.EqualTo("Test validation 1"));
    }

    [Test]
    public async Task ValidateAsync_WithMultipleValidators_ExecutesAll()
    {
        // Arrange
        var metadata = new List<ValidatorMetadata>
        {
            new() { ValidatorType = typeof(TestValidator1), ContentType = typeof(IHomePage) },
            new() { ValidatorType = typeof(TestValidator2), ContentType = typeof(IHomePage)}
        };

        RegisterValidator<TestValidator1>();
        RegisterValidator<TestValidator2>();
        _serviceProvider = _services.BuildServiceProvider();
        _sut = CreateRegistry(metadata);

        var content = CreateMockContent<IHomePage>();

        // Act
        var result = await _sut.ValidateAsync(content);

        // Assert
        Assert.That(result.Count(), Is.EqualTo(2));
        Assert.That(result.Any(m => m.Message == "Test validation 1"), Is.True);
        Assert.That(result.Any(m => m.Message == "Test validation 2"), Is.True);
    }

    [Test]
    public async Task ValidateAsync_WithInterfaceMatch_ExecutesValidator()
    {
        // Arrange
        var metadata = new List<ValidatorMetadata>
        {
            new() { ValidatorType = typeof(TestValidator1), ContentType = typeof(IBasePage) }
        };

        RegisterValidator<TestValidator1>();
        _serviceProvider = _services.BuildServiceProvider();
        _sut = CreateRegistry(metadata);

        var content = CreateMockContentWithInterface<IHomePageWithBase, IBasePage>();

        // Act
        var result = await _sut.ValidateAsync(content);

        // Assert
        Assert.That(result.Count(), Is.EqualTo(1));
    }

    #endregion

    #region Service Lifetime Tests

    [Test]
    public async Task ValidateAsync_WithSingletonValidator_ReusesSameInstance()
    {
        // Arrange
        var callCount = 0;
        var metadata = new List<ValidatorMetadata>
        {
            new() { ValidatorType = typeof(CountingValidator), ContentType = typeof(IHomePage) }
        };

        _services.AddSingleton(new CountingValidator(() => callCount++));
        _serviceProvider = _services.BuildServiceProvider();
        _sut = CreateRegistry(metadata);

        var content = CreateMockContent<IHomePage>();

        // Act - Validate twice
        await _sut.ValidateAsync(content);
        await _sut.ValidateAsync(content);

        // Assert - Should use same instance (constructor called once during setup)
        Assert.That(callCount, Is.EqualTo(2), "Validator should be called twice but using same instance");
    }

    [Test]
    public async Task ValidateAsync_WithScopedValidator_CreatesNewInstancePerScope()
    {
        // Arrange
        var instanceIds = new List<Guid>();
        var metadata = new List<ValidatorMetadata>
        {
            new() { ValidatorType = typeof(ScopedTrackingValidator), ContentType = typeof(IHomePage) }
        };

        _services.AddScoped(sp => new ScopedTrackingValidator(instanceIds));
        _serviceProvider = _services.BuildServiceProvider();
        _sut = CreateRegistry(metadata);

        var content = CreateMockContent<IHomePage>();

        // Act - Validate twice (each creates its own scope)
        await _sut.ValidateAsync(content);
        await _sut.ValidateAsync(content);

        // Assert - Should have two different instance IDs
        Assert.That(instanceIds, Has.Count.EqualTo(2));
        Assert.That(instanceIds[0], Is.Not.EqualTo(instanceIds[1]),
            "Scoped validator should create new instance per validation call");
    }

    [Test]
    public async Task ValidateAsync_WithTransientValidator_CreatesNewInstanceEachTime()
    {
        // Arrange
        var instanceIds = new List<Guid>();
        var metadata = new List<ValidatorMetadata>
        {
            new() { ValidatorType = typeof(TransientTrackingValidator), ContentType = typeof(IHomePage) }
        };

        _services.AddTransient(sp => new TransientTrackingValidator(instanceIds));
        _serviceProvider = _services.BuildServiceProvider();
        _sut = CreateRegistry(metadata);

        var content = CreateMockContent<IHomePage>();

        // Act
        await _sut.ValidateAsync(content);
        await _sut.ValidateAsync(content);

        // Assert
        Assert.That(instanceIds, Has.Count.EqualTo(2));
        Assert.That(instanceIds[0], Is.Not.EqualTo(instanceIds[1]));
    }

    #endregion

    #region Exception Handling Tests

    [Test]
    public async Task ValidateAsync_ValidatorThrowsException_ReturnsErrorMessage()
    {
        // Arrange
        var metadata = new List<ValidatorMetadata>
        {
            new() { ValidatorType = typeof(ThrowingValidator), ContentType = typeof(IHomePage) }
        };

        RegisterValidator<ThrowingValidator>();
        _serviceProvider = _services.BuildServiceProvider();
        _sut = CreateRegistry(metadata);

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
        var metadata = new List<ValidatorMetadata>
        {
            new() { ValidatorType = typeof(ThrowingValidator), ContentType = typeof(IHomePage) }
        };

        RegisterValidator<ThrowingValidator>();
        _serviceProvider = _services.BuildServiceProvider();
        _sut = CreateRegistry(metadata);

        var content = CreateMockContent<IHomePage>();

        // Act
        await _sut.ValidateAsync(content);

        // Assert
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Error executing validator")),
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
        _sut = CreateRegistry(new List<ValidatorMetadata>());
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
        var metadata = new List<ValidatorMetadata>
        {
            new() { ValidatorType = typeof(TestValidator1), ContentType = typeof(IHomePage) }
        };

        RegisterValidator<TestValidator1>();
        _serviceProvider = _services.BuildServiceProvider();
        _sut = CreateRegistry(metadata);

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
        var metadata = new List<ValidatorMetadata>
        {
            new() { ValidatorType = typeof(TestValidator1), ContentType = typeof(IArticle) }
        };

        RegisterValidator<TestValidator1>();
        _serviceProvider = _services.BuildServiceProvider();
        _sut = CreateRegistry(metadata);

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
        var metadata = new List<ValidatorMetadata>
        {
            new() { ValidatorType = typeof(TestValidator1), ContentType = typeof(IBasePage) }
        };

        RegisterValidator<TestValidator1>();
        _serviceProvider = _services.BuildServiceProvider();
        _sut = CreateRegistry(metadata);

        var content = CreateMockContentWithInterface<IHomePageWithBase, IBasePage>();

        // Act
        var result = _sut.HasValidator(content);

        // Assert
        Assert.That(result, Is.True);
    }

    #endregion

    #region Concurrent Access Tests

    [Test]
    public async Task ValidateAsync_ConcurrentCalls_ThreadSafe()
    {
        // Arrange
        var metadata = new List<ValidatorMetadata>
        {
            new() { ValidatorType = typeof(TestValidator1), ContentType = typeof(IHomePage) }
        };

        RegisterValidator<TestValidator1>();
        _serviceProvider = _services.BuildServiceProvider();
        _sut = CreateRegistry(metadata);

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

    #region Helper Methods

    private CustomValidatorRegistry CreateRegistry(List<ValidatorMetadata> metadata)
    {
        var scopeFactory = _serviceProvider.GetRequiredService<IServiceScopeFactory>();
        var logger = new Mock<ILogger<ValidatorLookup>>();
        var lookup = new ValidatorLookup(metadata, logger.Object);
        return new CustomValidatorRegistry(scopeFactory, lookup, _loggerMock.Object);
    }

    private void RegisterValidator<T>() where T : class, IDocumentValidator
    {
        _services.AddSingleton<T>();
    }

    private static T CreateMockContent<T>() where T : class, IPublishedContent
    {
        var contentTypeMock = new Mock<IPublishedContentType>();
        contentTypeMock.Setup(x => x.Alias).Returns("testPage");

        var mock = new Mock<T>();
        mock.Setup(c => c.Id).Returns(1);
        mock.Setup(c => c.Key).Returns(Guid.NewGuid());
        mock.Setup(c => c.ContentType).Returns(contentTypeMock.Object);
        return mock.Object;
    }

    private static T CreateMockContentWithInterface<T, TInterface>()
        where T : class, IPublishedContent, TInterface
        where TInterface : class
    {
        var contentTypeMock = new Mock<IPublishedContentType>();
        contentTypeMock.Setup(x => x.Alias).Returns("testPage");

        var mock = new Mock<T>();
        mock.Setup(c => c.Id).Returns(1);
        mock.Setup(c => c.Key).Returns(Guid.NewGuid());
        mock.Setup(c => c.ContentType).Returns(contentTypeMock.Object);
        mock.As<TInterface>();
        return mock.Object;
    }

    #endregion

    #region Test Validators

    private class TestValidator1 : IDocumentValidator
    {
        public Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
        {
            return Task.FromResult<IEnumerable<ValidationMessage>>(new List<ValidationMessage>
            {
                new() { Message = "Test validation 1", Severity = ValidationSeverity.Info }
            });
        }
    }

    private class TestValidator2 : IDocumentValidator
    {
        public Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
        {
            return Task.FromResult<IEnumerable<ValidationMessage>>(new List<ValidationMessage>
            {
                new() { Message = "Test validation 2", Severity = ValidationSeverity.Warning }
            });
        }
    }

    private class ThrowingValidator : IDocumentValidator
    {
        public Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
        {
            throw new InvalidOperationException("Test exception");
        }
    }

    private class CountingValidator : IDocumentValidator
    {
        private readonly Action _onValidate;

        public CountingValidator(Action onValidate)
        {
            _onValidate = onValidate;
        }

        public Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
        {
            _onValidate();
            return Task.FromResult<IEnumerable<ValidationMessage>>(new List<ValidationMessage>());
        }
    }

    private class ScopedTrackingValidator : IDocumentValidator
    {
        private readonly Guid _instanceId = Guid.NewGuid();
        private readonly List<Guid> _tracker;

        public ScopedTrackingValidator(List<Guid> tracker)
        {
            _tracker = tracker;
            _tracker.Add(_instanceId);
        }

        public Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
        {
            return Task.FromResult<IEnumerable<ValidationMessage>>(new List<ValidationMessage>());
        }
    }

    private class TransientTrackingValidator : IDocumentValidator
    {
        private readonly Guid _instanceId = Guid.NewGuid();
        private readonly List<Guid> _tracker;

        public TransientTrackingValidator(List<Guid> tracker)
        {
            _tracker = tracker;
            _tracker.Add(_instanceId);
        }

        public Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
        {
            return Task.FromResult<IEnumerable<ValidationMessage>>(new List<ValidationMessage>());
        }
    }

    #endregion
}
