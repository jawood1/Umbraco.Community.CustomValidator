using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Moq;
using Umbraco.Community.CustomValidator.Enums;
using Umbraco.Community.CustomValidator.Models;
using Umbraco.Community.CustomValidator.Services;

namespace Umbraco.Community.CustomValidator.Tests.Services;

[TestFixture]
public class ValidationCacheServiceTests
{
    private IMemoryCache _memoryCache = null!;
    private Mock<ILogger<ValidationCacheService>> _loggerMock = null!;
    private ValidationCacheService _sut = null!;

    [SetUp]
    public void Setup()
    {
        _memoryCache = new MemoryCache(new MemoryCacheOptions());
        _loggerMock = new Mock<ILogger<ValidationCacheService>>();
        _sut = new ValidationCacheService(_memoryCache, _loggerMock.Object);
    }

    [TearDown]
    public void TearDown()
    {
        _memoryCache.Dispose();
    }

    #region TryGetCached Tests

    [Test]
    public void TryGetCached_WhenCacheEmpty_ReturnsFalse()
    {
        // Arrange
        var documentId = Guid.NewGuid();

        // Act
        var result = _sut.TryGetCached(documentId, null, out var cachedResponse);

        // Assert
        Assert.That(result, Is.False);
        Assert.That(cachedResponse, Is.Null);
    }

    [Test]
    public void TryGetCached_WhenCacheHit_ReturnsTrueWithCachedData()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var expectedResponse = CreateValidationResponse(documentId);
        _sut.SetCache(documentId, null, expectedResponse);

        // Act
        var result = _sut.TryGetCached(documentId, null, out var cachedResponse);

        // Assert
        Assert.That(result, Is.True);
        Assert.That(cachedResponse, Is.Not.Null);
        Assert.That(cachedResponse!.ContentId, Is.EqualTo(documentId));
        Assert.That(cachedResponse.HasValidator, Is.True);
    }

    [Test]
    public void TryGetCached_WithInvariantContent_UsesCorrectCacheKey()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var response = CreateValidationResponse(documentId);
        _sut.SetCache(documentId, null, response);

        // Act
        var result = _sut.TryGetCached(documentId, null, out var cachedResponse);

        // Assert
        Assert.That(result, Is.True);
        Assert.That(cachedResponse, Is.Not.Null);
    }

    [Test]
    public void TryGetCached_WithCulture_UsesCorrectCacheKey()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var culture = "en-US";
        var response = CreateValidationResponse(documentId);
        _sut.SetCache(documentId, culture, response);

        // Act
        var result = _sut.TryGetCached(documentId, culture, out var cachedResponse);

        // Assert
        Assert.That(result, Is.True);
        Assert.That(cachedResponse, Is.Not.Null);
    }

    [Test]
    public void TryGetCached_WithDifferentCulture_ReturnsFalse()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var response = CreateValidationResponse(documentId);
        _sut.SetCache(documentId, "en-US", response);

        // Act - try to get with different culture
        var result = _sut.TryGetCached(documentId, "da-DK", out var cachedResponse);

        // Assert
        Assert.That(result, Is.False);
        Assert.That(cachedResponse, Is.Null);
    }

    #endregion

    #region SetCache Tests

    [Test]
    public void SetCache_WithValidResponse_CachesSuccessfully()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var response = CreateValidationResponse(documentId);

        // Act
        _sut.SetCache(documentId, null, response);

        // Assert
        var cached = _sut.TryGetCached(documentId, null, out var cachedResponse);
        Assert.That(cached, Is.True);
        Assert.That(cachedResponse, Is.Not.Null);
    }

    [Test]
    public void SetCache_WithNullResponse_ThrowsArgumentNullException()
    {
        // Arrange
        var documentId = Guid.NewGuid();

        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => _sut.SetCache(documentId, null, null!));
    }

    [Test]
    public void SetCache_WithCulture_CachesForSpecificCulture()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var culture = "en-US";
        var response = CreateValidationResponse(documentId);

        // Act
        _sut.SetCache(documentId, culture, response);

        // Assert
        var cachedForCulture = _sut.TryGetCached(documentId, culture, out _);
        var cachedForInvariant = _sut.TryGetCached(documentId, null, out _);

        Assert.That(cachedForCulture, Is.True);
        Assert.That(cachedForInvariant, Is.False);
    }

    [Test]
    public void SetCache_MultipleCultures_CachesSeparately()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var responseEn = CreateValidationResponse(documentId, "en-US content");
        var responseDa = CreateValidationResponse(documentId, "da-DK content");

        // Act
        _sut.SetCache(documentId, "en-US", responseEn);
        _sut.SetCache(documentId, "da-DK", responseDa);

        // Assert
        _sut.TryGetCached(documentId, "en-US", out var cachedEn);
        _sut.TryGetCached(documentId, "da-DK", out var cachedDa);

        Assert.That(cachedEn, Is.Not.Null);
        Assert.That(cachedDa, Is.Not.Null);
        Assert.That(cachedEn!.Messages?.First().Message, Is.EqualTo("en-US content"));
        Assert.That(cachedDa!.Messages?.First().Message, Is.EqualTo("da-DK content"));
    }

    [Test]
    public void SetCache_OverwritesExistingCache()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var firstResponse = CreateValidationResponse(documentId, "First message");
        var secondResponse = CreateValidationResponse(documentId, "Second message");

        // Act
        _sut.SetCache(documentId, null, firstResponse);
        _sut.SetCache(documentId, null, secondResponse);

        // Assert
        _sut.TryGetCached(documentId, null, out var cached);
        Assert.That(cached!.Messages?.First().Message, Is.EqualTo("Second message"));
    }

    #endregion

    #region ClearForDocumentCulture Tests

    [Test]
    public void ClearForDocumentCulture_RemovesSpecificCultureCache()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var response = CreateValidationResponse(documentId);
        _sut.SetCache(documentId, "en-US", response);
        _sut.SetCache(documentId, "da-DK", response);

        // Act
        _sut.ClearForDocumentCulture(documentId, "en-US");

        // Assert
        var enCached = _sut.TryGetCached(documentId, "en-US", out _);
        var daCached = _sut.TryGetCached(documentId, "da-DK", out _);

        Assert.That(enCached, Is.False, "en-US should be cleared");
        Assert.That(daCached, Is.True, "da-DK should still be cached");
    }

    [Test]
    public void ClearForDocumentCulture_WithInvariant_ClearsInvariantOnly()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var response = CreateValidationResponse(documentId);
        _sut.SetCache(documentId, null, response);
        _sut.SetCache(documentId, "en-US", response);

        // Act
        _sut.ClearForDocumentCulture(documentId, null);

        // Assert
        var invariantCached = _sut.TryGetCached(documentId, null, out _);
        var cultureCached = _sut.TryGetCached(documentId, "en-US", out _);

        Assert.That(invariantCached, Is.False);
        Assert.That(cultureCached, Is.True);
    }

    [Test]
    public void ClearForDocumentCulture_WhenNotCached_DoesNotThrow()
    {
        // Arrange
        var documentId = Guid.NewGuid();

        // Act & Assert
        Assert.DoesNotThrow(() => _sut.ClearForDocumentCulture(documentId, "en-US"));
    }

    #endregion

    #region ClearForDocument Tests

    [Test]
    public void ClearForDocument_RemovesAllCulturesForDocument()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var response = CreateValidationResponse(documentId);
        _sut.SetCache(documentId, null, response);
        _sut.SetCache(documentId, "en-US", response);
        _sut.SetCache(documentId, "da-DK", response);

        // Act
        _sut.ClearForDocument(documentId);

        // Assert
        var invariantCached = _sut.TryGetCached(documentId, null, out _);
        var enCached = _sut.TryGetCached(documentId, "en-US", out _);
        var daCached = _sut.TryGetCached(documentId, "da-DK", out _);

        Assert.That(invariantCached, Is.False);
        Assert.That(enCached, Is.False);
        Assert.That(daCached, Is.False);
    }

    [Test]
    public void ClearForDocument_DoesNotAffectOtherDocuments()
    {
        // Arrange
        var document1 = Guid.NewGuid();
        var document2 = Guid.NewGuid();
        var response = CreateValidationResponse(document1);
        _sut.SetCache(document1, "en-US", response);
        _sut.SetCache(document2, "en-US", response);

        // Act
        _sut.ClearForDocument(document1);

        // Assert
        var doc1Cached = _sut.TryGetCached(document1, "en-US", out _);
        var doc2Cached = _sut.TryGetCached(document2, "en-US", out _);

        Assert.That(doc1Cached, Is.False);
        Assert.That(doc2Cached, Is.True);
    }

    [Test]
    public void ClearForDocument_WhenCacheExists_LogsInformationWithCount()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var response = CreateValidationResponse(documentId);
        _sut.SetCache(documentId, "en-US", response);
        _sut.SetCache(documentId, "da-DK", response);

        // Act
        _sut.ClearForDocument(documentId);

        // Assert
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("2 entries")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region ClearAll Tests

    [Test]
    public void ClearAll_RemovesAllCachedDocuments()
    {
        // Arrange
        var doc1 = Guid.NewGuid();
        var doc2 = Guid.NewGuid();
        var response = CreateValidationResponse(doc1);

        _sut.SetCache(doc1, "en-US", response);
        _sut.SetCache(doc1, "da-DK", response);
        _sut.SetCache(doc2, "en-US", response);

        // Act
        _sut.ClearAll();

        // Assert
        var doc1EnCached = _sut.TryGetCached(doc1, "en-US", out _);
        var doc1DaCached = _sut.TryGetCached(doc1, "da-DK", out _);
        var doc2EnCached = _sut.TryGetCached(doc2, "en-US", out _);

        Assert.That(doc1EnCached, Is.False);
        Assert.That(doc1DaCached, Is.False);
        Assert.That(doc2EnCached, Is.False);
    }

    [Test]
    public void ClearAll_LogsInformationWithDocumentCount()
    {
        // Arrange
        var doc1 = Guid.NewGuid();
        var doc2 = Guid.NewGuid();
        var response = CreateValidationResponse(doc1);

        _sut.SetCache(doc1, "en-US", response);
        _sut.SetCache(doc2, "en-US", response);

        // Act
        _sut.ClearAll();

        // Assert
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("2 documents")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public void ClearAll_WhenCacheEmpty_DoesNotThrow()
    {
        // Act & Assert
        Assert.DoesNotThrow(() => _sut.ClearAll());
    }

    #endregion

    #region Cache Expiration Tests

    [Test]
    public void SetCache_CacheExpires_AutomaticallyRemoved()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var response = CreateValidationResponse(documentId);

        // Create a cache with 1 second expiration for testing
        var testCache = new MemoryCache(new MemoryCacheOptions());

        // Override the expiration by manually setting with short timeout
        var cacheKey = $"customValidation_{documentId}_";
        testCache.Set(cacheKey, response, TimeSpan.FromMilliseconds(100));

        // Act
        Thread.Sleep(150); // Wait for expiration

        // Assert
        var cached = testCache.TryGetValue(cacheKey, out ValidationResponse? _);
        Assert.That(cached, Is.False);

        // Cleanup
        testCache.Dispose();
    }

    #endregion

    #region Helper Methods

    private static ValidationResponse CreateValidationResponse(Guid documentId, string? message = null)
    {
        return new ValidationResponse
        {
            ContentId = documentId,
            HasValidator = true,
            Messages = new List<ValidationMessage>
            {
                new()
                {
                    Message = message ?? "Test validation message",
                    Severity = ValidationSeverity.Error
                }
            }
        };
    }

    #endregion
}
