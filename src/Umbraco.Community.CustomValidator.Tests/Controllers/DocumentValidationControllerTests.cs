using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Web;
using Umbraco.Community.CustomValidator.Controllers;
using Umbraco.Community.CustomValidator.Enums;
using Umbraco.Community.CustomValidator.Interfaces;
using Umbraco.Community.CustomValidator.Models;
using Umbraco.Community.CustomValidator.Services;
using Umbraco.Community.CustomValidator.Validation;

namespace Umbraco.Community.CustomValidator.Tests.Controllers;

using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Options;

[TestFixture]
public class DocumentValidationControllerTests
{
    private DocumentValidationService _validationService = null!;
    private ValidationCacheService _cacheService = null!;
    private Mock<IUmbracoContextAccessor> _umbracoContextAccessorMock = null!;
    private Mock<IVariationContextAccessor> _variationContextAccessorMock = null!;
    private Mock<ILanguageService> _languageServiceMock = null!;
    private Mock<ILogger<DocumentValidationController>> _loggerMock = null!;
    private DocumentValidationController _sut = null!;

    private ServiceProvider _serviceProvider = null!;
    private HybridCache _memoryCache = null!;

    [SetUp]
    public void Setup()
    {
        // Create real services with DI
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddHybridCache();

        _serviceProvider = services.BuildServiceProvider();
        _memoryCache = _serviceProvider.GetRequiredService<HybridCache>();

        // Create real instances
        _validationService = new DocumentValidationService(
            _serviceProvider,
            _serviceProvider.GetRequiredService<ILogger<DocumentValidationService>>());

        var mockOptions = new Mock<IOptions<CustomValidatorOptions>>();
        mockOptions.Setup(s => s.Value).Returns(new CustomValidatorOptions());

        _cacheService = new ValidationCacheService(
            _memoryCache,
            mockOptions.Object,
            _serviceProvider.GetRequiredService<ILogger<ValidationCacheService>>());

        // Mock Umbraco dependencies
        _umbracoContextAccessorMock = new Mock<IUmbracoContextAccessor>();
        _variationContextAccessorMock = new Mock<IVariationContextAccessor>();
        _languageServiceMock = new Mock<ILanguageService>();
        _loggerMock = new Mock<ILogger<DocumentValidationController>>();

        _sut = new DocumentValidationController(
            _validationService,
            _cacheService,
            _umbracoContextAccessorMock.Object,
            _variationContextAccessorMock.Object,
            _languageServiceMock.Object,
            _loggerMock.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _serviceProvider.Dispose();
        _sut.Dispose();
    }

    #region ValidateDocument Tests - Cache Hit

    [Test]
    public async Task ValidateDocument_WithCacheHit_ReturnsCachedResponse()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var culture = "en-US"; // Use explicit culture to avoid GetCultureFromDomains issues
        var expectedResponse = CreateValidationResponse(documentId);

        // Mock language service
        _languageServiceMock.Setup(x => x.GetDefaultIsoCodeAsync())
            .ReturnsAsync("en-GB");

        // Pre-populate cache by calling GetOrSetAsync with factory that returns expected response
        await _cacheService.GetOrSetAsync(
            documentId,
            culture,
            async (ct) => expectedResponse,
            CancellationToken.None);

        // Act
        var result = await _sut.ValidateDocument(documentId, culture);

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);

        var response = okResult!.Value as ValidationResponse;
        Assert.That(response, Is.Not.Null);
        Assert.That(response!.ContentId, Is.EqualTo(documentId));
    }

    #endregion

    #region ValidateDocument Tests - Cache Miss, No Validator

    [Test]
    public async Task ValidateDocument_WithNoValidator_ReturnsNoValidatorResponse()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var content = CreateMockContent();

        SetupUmbracoContext(content);

        // Act
        var result = await _sut.ValidateDocument(documentId, null);

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);

        var response = okResult!.Value as ValidationResponse;
        Assert.That(response, Is.Not.Null);
        Assert.That(response!.ContentId, Is.EqualTo(documentId));
        Assert.That(response.HasValidator, Is.False);
        Assert.That(response.Messages, Is.Empty);
    }

    [Test]
    public async Task ValidateDocument_ContentNotFound_ReturnsNoValidatorResponse()
    {
        // Arrange
        var documentId = Guid.NewGuid();

        SetupUmbracoContext(null); // Content not found

        // Act
        var result = await _sut.ValidateDocument(documentId, null);

        // Assert
        var okResult = result as OkObjectResult;
        Assert.That(okResult, Is.Not.Null);

        var response = okResult!.Value as ValidationResponse;
        Assert.That(response!.HasValidator, Is.False);
    }

    #endregion

    #region ValidateDocument Tests - Cache Miss, With Validator

    [Test]
    public async Task ValidateDocument_WithValidator_PerformsValidation()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var content = CreateMockContent();

        // Register a test validator and recreate services
        var validationService = CreateValidationServiceWithValidator();

        var sut = new DocumentValidationController(
            validationService,
            _cacheService,
            _umbracoContextAccessorMock.Object,
            _variationContextAccessorMock.Object,
            _languageServiceMock.Object,  // Use the mocked language service
            _loggerMock.Object);

        SetupUmbracoContext(content);

        // Act
        var result = await sut.ValidateDocument(documentId, "en-US");

        // Assert
        Assert.That(result, Is.InstanceOf<OkObjectResult>());

        var okResult = result as OkObjectResult;
        var response = okResult!.Value as ValidationResponse;

        Assert.That(response, Is.Not.Null);
        Assert.That(response!.HasValidator, Is.True);
        Assert.That(response.Messages?.Count(), Is.EqualTo(1));
        Assert.That(response.Messages.First().Message, Is.EqualTo("Test validation"));
    }

    #endregion

    #region Culture Handling Tests

    [Test]
    public async Task ValidateDocument_WithCulture_SetsVariationContext()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var culture = "en-US";
        var content = CreateMockContent();

        var validationService = CreateValidationServiceWithValidator();
        var sut = new DocumentValidationController(
            validationService,
            _cacheService,
            _umbracoContextAccessorMock.Object,
            _variationContextAccessorMock.Object,
            _languageServiceMock.Object,
            _loggerMock.Object);

        SetupUmbracoContext(content);

        // Act
        await sut.ValidateDocument(documentId, culture);

        // Assert
        _variationContextAccessorMock.VerifySet(x => x.VariationContext = It.IsAny<VariationContext>(), Times.Once);
    }

    #endregion

    #region Exception Handling Tests

    [Test]
    public async Task ValidateDocument_WhenExceptionThrown_ReturnsProblemResult()
    {
        // Arrange
        var documentId = Guid.NewGuid();

        // Setup Umbraco context to throw
        var context = It.IsAny<IUmbracoContext>();
        _umbracoContextAccessorMock.Setup(x => x.TryGetUmbracoContext(out context))
            .Throws(new InvalidOperationException("Test exception"));

        // Act
        var result = await _sut.ValidateDocument(documentId, null);

        // Assert
        var problemResult = result as ObjectResult;
        Assert.That(problemResult, Is.Not.Null);
        Assert.That(problemResult!.StatusCode, Is.EqualTo(StatusCodes.Status500InternalServerError));
    }

    [Test]
    public async Task ValidateDocument_WhenExceptionThrown_LogsError()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var exception = new InvalidOperationException("Test exception");

        var context = It.IsAny<IUmbracoContext>();
        _umbracoContextAccessorMock.Setup(x => x.TryGetUmbracoContext(out context)).Throws(exception);

        // Act
        await _sut.ValidateDocument(documentId, null);

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

        // Setup content cache
        contentCacheMock.Setup(x => x.GetById(true, It.IsAny<Guid>())).Returns(content);

        // Setup umbraco context
        umbracoContextMock.Setup(x => x.Content).Returns(contentCacheMock.Object);

        var context = umbracoContextMock.Object;

        _umbracoContextAccessorMock.Setup(x => x.TryGetUmbracoContext(out context))
            .Returns(true);
    }

    private static IPublishedContent CreateMockContent()
    {
        var contentTypeMock = new Mock<IPublishedContentType>();
        contentTypeMock.Setup(x => x.Alias).Returns("testPage");
        contentTypeMock.Setup(x => x.ItemType).Returns(PublishedItemType.Content);

        var contentMock = new Mock<IPublishedContent>();
        contentMock.Setup(x => x.Id).Returns(1);
        contentMock.Setup(x => x.Name).Returns("Test Page");
        contentMock.Setup(x => x.ContentType).Returns(contentTypeMock.Object);
        contentMock.Setup(x => x.Key).Returns(Guid.NewGuid());

        return contentMock.Object;
    }

    private DocumentValidationService CreateValidationServiceWithValidator()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddSingleton<TestValidator>();
        services.AddSingleton<IDocumentValidator>(sp => sp.GetRequiredService<TestValidator>());

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

    #region Test Classes

    private class TestValidator : IDocumentValidator
    {
        // Match the actual type name that Moq generates
        public string NameOfType => "IPublishedContent"; // The interface name

        public Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
        {
            return Task.FromResult<IEnumerable<ValidationMessage>>(new List<ValidationMessage>
            {
                new() { Message = "Test validation", Severity = ValidationSeverity.Info }
            });
        }
    }

    #endregion
}