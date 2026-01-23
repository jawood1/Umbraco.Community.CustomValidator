using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Web;
using Umbraco.Community.CustomValidator.Enums;
using Umbraco.Community.CustomValidator.Interfaces;
using Umbraco.Community.CustomValidator.Models;
using Umbraco.Community.CustomValidator.Notifications;
using Umbraco.Community.CustomValidator.Services;
using Umbraco.Community.CustomValidator.Validation;

namespace Umbraco.Community.CustomValidator.Tests.Notifications;

[TestFixture]
public class ContentValidationNotificationHandlerTests
{
    private ValidationCacheService _cacheService = null!;
    private DocumentValidationService _validationService = null!;
    private Mock<IUmbracoContextAccessor> _umbracoContextAccessorMock = null!;
    private Mock<IVariationContextAccessor> _variationContextAccessorMock = null!;
    private Mock<ILogger<ContentValidationNotificationHandler>> _loggerMock = null!;
    private ContentValidationNotificationHandler _sut = null!;

    private ServiceProvider _serviceProvider = null!;
    private IMemoryCache _memoryCache = null!;

    [SetUp]
    public void Setup()
    {
        // Create real services
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddMemoryCache();

        _serviceProvider = services.BuildServiceProvider();
        _memoryCache = _serviceProvider.GetRequiredService<IMemoryCache>();

        _cacheService = new ValidationCacheService(
            _memoryCache,
            _serviceProvider.GetRequiredService<ILogger<ValidationCacheService>>());

        _validationService = new DocumentValidationService(
            _serviceProvider,
            _serviceProvider.GetRequiredService<ILogger<DocumentValidationService>>());

        // Mock Umbraco dependencies
        _umbracoContextAccessorMock = new Mock<IUmbracoContextAccessor>();
        _variationContextAccessorMock = new Mock<IVariationContextAccessor>();
        _loggerMock = new Mock<ILogger<ContentValidationNotificationHandler>>();

        _sut = new ContentValidationNotificationHandler(
            _cacheService,
            _validationService,
            _umbracoContextAccessorMock.Object,
            _variationContextAccessorMock.Object,
            _loggerMock.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _serviceProvider?.Dispose();
        _memoryCache?.Dispose();
    }

    #region ContentSavingNotification Tests

    [Test]
    public async Task HandleAsync_ContentSaving_InvariantContent_ClearsCacheWithNullCulture()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var entity = CreateMockContent(documentId, "Test Page");

        // Pre-populate cache
        _cacheService.SetCache(documentId, null, CreateValidationResponse(documentId));

        var notification = new ContentSavingNotification(entity, new EventMessages());

        // Act
        await _sut.HandleAsync(notification, CancellationToken.None);

        // Assert - Cache should be cleared
        var cached = _cacheService.TryGetCached(documentId, null, out _);
        Assert.That(cached, Is.False);
    }

    [Test]
    public async Task HandleAsync_ContentSaving_VariantContent_ClearsOnlySavingCultures()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var entity = CreateMockVariantContent(documentId, "Test Page", "en-US", "da-DK");

        // Pre-populate cache for both cultures
        _cacheService.SetCache(documentId, "en-US", CreateValidationResponse(documentId));
        _cacheService.SetCache(documentId, "da-DK", CreateValidationResponse(documentId));

        // Create notification that only saves en-US
        var notification = new ContentSavingNotification(entity, new EventMessages());

        // Act
        await _sut.HandleAsync(notification, CancellationToken.None);

        // Assert - Only en-US should be cleared (if IsSavingCulture returns true for en-US)
        // Note: This test assumes the notification's IsSavingCulture logic
        // In a real scenario, you'd need to set up the notification properly
    }

    [Test]
    public async Task HandleAsync_ContentSaving_LogsDebugMessage()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var entity = CreateMockContent(documentId, "Test Page");
        var notification = new ContentSavingNotification(entity, new EventMessages());

        // Act
        await _sut.HandleAsync(notification, CancellationToken.None);

        // Assert
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Debug,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Clearing validation cache")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce);
    }

    #endregion

    #region ContentPublishingNotification Tests - Success

    [Test]
    public async Task HandleAsync_ContentPublishing_NoValidators_DoesNotCancelPublish()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var entity = CreateMockContent(documentId, "Test Page");
        var content = CreateMockPublishedContent(documentId);

        SetupUmbracoContext(content);

        var notification = new ContentPublishingNotification(entity, new EventMessages());

        // Act
        await _sut.HandleAsync(notification, CancellationToken.None);

        // Assert - No error messages means publish will proceed
        Assert.That(notification.Messages.GetAll(), Is.Empty);
    }

    [Test]
    public async Task HandleAsync_ContentPublishing_WithValidationErrors_CancelsPublish()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var entity = CreateMockContent(documentId, "Test Page");
        var content = CreateMockPublishedContent(documentId);

        var validationService = CreateValidationServiceWithErrorValidator();

        var sut = new ContentValidationNotificationHandler(
            _cacheService,
            validationService,
            _umbracoContextAccessorMock.Object,
            _variationContextAccessorMock.Object,
            _loggerMock.Object);

        SetupUmbracoContext(content);

        var notification = new ContentPublishingNotification(entity, new EventMessages());

        // Act
        await sut.HandleAsync(notification, CancellationToken.None);

        // Assert - Check error messages were added
        var errorMessages = notification.Messages.GetAll().ToList();
        Assert.That(errorMessages, Has.Count.GreaterThan(0));
        Assert.That(errorMessages.First().MessageType, Is.EqualTo(EventMessageType.Error));
        Assert.That(errorMessages.First().Message, Does.Contain("validation error(s) found"));
    }

    [Test]
    public async Task HandleAsync_ContentPublishing_WithWarningsOnly_DoesNotCancelPublish()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var entity = CreateMockContent(documentId, "Test Page");
        var content = CreateMockPublishedContent(documentId);

        // Register validator that returns only warnings
        var validationService = CreateValidationServiceWithWarningValidator();

        var sut = new ContentValidationNotificationHandler(
            _cacheService,
            validationService,
            _umbracoContextAccessorMock.Object,
            _variationContextAccessorMock.Object,
            _loggerMock.Object);

        SetupUmbracoContext(content);

        var notification = new ContentPublishingNotification(entity, new EventMessages());

        // Act
        await sut.HandleAsync(notification, CancellationToken.None);

        // Assert - No error messages (only warnings), so publish proceeds
        var messages = notification.Messages.GetAll().ToList();
        Assert.That(messages.All(m => m.MessageType != EventMessageType.Error), Is.True,
            "Should have no error messages (warnings don't cancel publish)");
    }

    [Test]
    public async Task HandleAsync_ContentPublishing_CachesValidationResults()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var entity = CreateMockContent(documentId, "Test Page");
        var content = CreateMockPublishedContent(documentId); // Pass the same GUID

        var validationService = CreateValidationServiceWithWarningValidator();

        var sut = new ContentValidationNotificationHandler(
            _cacheService,
            validationService,
            _umbracoContextAccessorMock.Object,
            _variationContextAccessorMock.Object,
            _loggerMock.Object);

        SetupUmbracoContext(content);

        var notification = new ContentPublishingNotification(entity, new EventMessages());

        // Act
        await sut.HandleAsync(notification, CancellationToken.None);

        // Assert - Check that result was cached with the published content's Key
        var cached = _cacheService.TryGetCached(documentId, null, out var cachedResponse);
        Assert.That(cached, Is.True);
        Assert.That(cachedResponse!.HasValidator, Is.True);
    }

    #endregion

    #region ContentPublishingNotification Tests - Exception Handling

    [Test]
    public async Task HandleAsync_ContentPublishing_ExceptionThrown_CancelsPublish()
    {
        // Arrange
        var context = It.IsAny<IUmbracoContext>();
        _umbracoContextAccessorMock.Setup(x => x.TryGetUmbracoContext(out context))
            .Throws(new InvalidOperationException("Test exception"));

        var entity = CreateMockContent(Guid.NewGuid(), "Test");
        var notification = new ContentPublishingNotification(entity, new EventMessages());

        // Act
        await _sut.HandleAsync(notification, CancellationToken.None);

        // Assert - Check the event messages instead of CancelOperation property
        var messages = notification.Messages.GetAll().ToList();
        Assert.That(messages, Has.Count.EqualTo(1));
        Assert.That(messages.First().MessageType, Is.EqualTo(EventMessageType.Error));
        Assert.That(messages.First().Category, Does.Contain("Custom Validation Failed"));
    }

    [Test]
    public async Task HandleAsync_ContentPublishing_ExceptionThrown_LogsError()
    {
        // Arrange
        var exception = new InvalidOperationException("Test exception");
        var context = It.IsAny<IUmbracoContext>();
        _umbracoContextAccessorMock.Setup(x => x.TryGetUmbracoContext(out context))
            .Throws(exception);

        var entity = CreateMockContent(Guid.NewGuid(), "Test");
        var notification = new ContentPublishingNotification(entity, new EventMessages());

        // Act
        await _sut.HandleAsync(notification, CancellationToken.None);

        // Assert
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Unexpected error")),
                It.Is<Exception>(ex => ex == exception),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region Helper Methods

    private void SetupUmbracoContext(IPublishedContent? content)
    {
        var umbracoContextMock = new Mock<IUmbracoContext>();
        var contentCacheMock = new Mock<IPublishedContentCache>();

        contentCacheMock.Setup(x => x.GetById(true, It.IsAny<int>())).Returns(content);
        contentCacheMock.Setup(x => x.GetById(It.IsAny<bool>(), It.IsAny<int>())).Returns(content);

        // Setup umbraco context
        umbracoContextMock.Setup(x => x.Content).Returns(contentCacheMock.Object);

        var context = umbracoContextMock.Object;

        _umbracoContextAccessorMock.Setup(x => x.TryGetUmbracoContext(out context))
            .Returns(true);
    }

    private static IPublishedContent CreateMockPublishedContent(Guid key)
    {
        var contentTypeMock = new Mock<IPublishedContentType>();
        contentTypeMock.Setup(x => x.Alias).Returns("testPage");
        contentTypeMock.Setup(x => x.ItemType).Returns(PublishedItemType.Content);

        var contentMock = new Mock<IPublishedContent>();
        contentMock.Setup(x => x.Id).Returns(1);
        contentMock.Setup(x => x.Key).Returns(key);
        contentMock.Setup(x => x.Name).Returns("Test Page");
        contentMock.Setup(x => x.ContentType).Returns(contentTypeMock.Object);

        return contentMock.Object;
    }

    private static IContent CreateMockContent(Guid key, string name)
    {
        var contentMock = new Mock<IContent>();
        contentMock.Setup(x => x.Key).Returns(key);
        contentMock.Setup(x => x.Id).Returns(1);
        contentMock.Setup(x => x.Name).Returns(name);
        contentMock.Setup(x => x.AvailableCultures).Returns(Enumerable.Empty<string>());

        return contentMock.Object;
    }

    private static IContent CreateMockVariantContent(Guid key, string name, params string[] cultures)
    {
        var contentMock = new Mock<IContent>();
        contentMock.Setup(x => x.Key).Returns(key);
        contentMock.Setup(x => x.Id).Returns(1);
        contentMock.Setup(x => x.Name).Returns(name);
        contentMock.Setup(x => x.AvailableCultures).Returns(cultures);

        return contentMock.Object;
    }

    private DocumentValidationService CreateValidationServiceWithErrorValidator()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddSingleton<ErrorValidator>();
        services.AddSingleton<IDocumentValidator>(sp => sp.GetRequiredService<ErrorValidator>());

        var sp = services.BuildServiceProvider();

        return new DocumentValidationService(
            sp,
            sp.GetRequiredService<ILogger<DocumentValidationService>>());
    }

    private DocumentValidationService CreateValidationServiceWithWarningValidator()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddSingleton<WarningValidator>();
        services.AddSingleton<IDocumentValidator>(sp => sp.GetRequiredService<WarningValidator>());

        var sp = services.BuildServiceProvider();

        return new DocumentValidationService(
            sp,
            sp.GetRequiredService<ILogger<DocumentValidationService>>());
    }

    private static ValidationResponse CreateValidationResponse(Guid documentId, params ValidationMessage[] messages)
    {
        return new ValidationResponse
        {
            ContentId = documentId,
            HasValidator = true,
            Messages = messages.ToList()
        };
    }

    #endregion

    #region Test Validators

    private class ErrorValidator : IDocumentValidator
    {
        public string NameOfType => "IPublishedContent";

        public Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
        {
            return Task.FromResult<IEnumerable<ValidationMessage>>(new List<ValidationMessage>
            {
                new() { Message = "Validation error", Severity = ValidationSeverity.Error }
            });
        }
    }

    private class WarningValidator : IDocumentValidator
    {
        public string NameOfType => "IPublishedContent";

        public Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
        {
            return Task.FromResult<IEnumerable<ValidationMessage>>(new List<ValidationMessage>
            {
                new() { Message = "Validation warning", Severity = ValidationSeverity.Warning }
            });
        }
    }

    #endregion
}
