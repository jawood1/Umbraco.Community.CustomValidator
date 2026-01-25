using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Umbraco.Community.CustomValidator.Enums;
using Umbraco.Community.CustomValidator.Models;
using Umbraco.Community.CustomValidator.Services;

namespace Umbraco.Community.CustomValidator.Tests.Services;

[TestFixture]
public class ValidationCacheServiceTests
{
    private HybridCache _hybridCache = null!;
    private Mock<ILogger<ValidationCacheService>> _loggerMock = null!;
    private Mock<IOptions<CustomValidatorOptions>> _optionsMock = null!;
    private ValidationCacheService _sut = null!;
    private CustomValidatorOptions _options = null!;

    [SetUp]
    public void Setup()
    {
        _options = new CustomValidatorOptions
        {
            CacheExpirationMinutes = 30,
            TreatWarningsAsErrors = false
        };

        _optionsMock = new Mock<IOptions<CustomValidatorOptions>>();
        _optionsMock.Setup(x => x.Value).Returns(_options);

        // Create real HybridCache instance
        var services = new ServiceCollection();
        services.AddHybridCache();
        var serviceProvider = services.BuildServiceProvider();
        _hybridCache = serviceProvider.GetRequiredService<HybridCache>();

        _loggerMock = new Mock<ILogger<ValidationCacheService>>();
        _sut = new ValidationCacheService(_hybridCache, _optionsMock.Object, _loggerMock.Object);
    }

    #region GetOrSetAsync Tests

    [Test]
    public async Task GetOrSetAsync_WhenCacheEmpty_CallsFactory()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var expectedResponse = CreateValidationResponse(documentId);
        var factoryCalled = false;

        // Act
        var result = await _sut.GetOrSetAsync(
            documentId,
            null,
            async (ct) =>
            {
                factoryCalled = true;
                return await new ValueTask<ValidationResponse>(expectedResponse);
            });

        // Assert
        Assert.That(factoryCalled, Is.True);
        Assert.That(result.ContentId, Is.EqualTo(documentId));
    }

    [Test]
    public async Task GetOrSetAsync_CalledTwice_UsesCacheOnSecondCall()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var expectedResponse = CreateValidationResponse(documentId);
        var factoryCallCount = 0;

        // Act - Call twice
        await _sut.GetOrSetAsync(documentId, null, async (ct) =>
        {
            factoryCallCount++;
            return await new ValueTask<ValidationResponse>(expectedResponse);
        });

        await _sut.GetOrSetAsync(documentId, null, async (ct) =>
        {
            factoryCallCount++;
            return await new ValueTask<ValidationResponse>(expectedResponse);
        });

        // Assert - Factory should only be called once (second call used cache)
        Assert.That(factoryCallCount, Is.EqualTo(1));
    }

    [Test]
    public async Task GetOrSetAsync_WithCulture_CachesSeparately()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var responseEn = CreateValidationResponse(documentId, "en-US content");
        var responseDa = CreateValidationResponse(documentId, "da-DK content");

        // Act
        var resultEn = await _sut.GetOrSetAsync(documentId, "en-US",
            async (ct) => await new ValueTask<ValidationResponse>(responseEn));

        var resultDa = await _sut.GetOrSetAsync(documentId, "da-DK",
            async (ct) => await new ValueTask<ValidationResponse>(responseDa));

        // Assert
        Assert.That(resultEn.Messages.First().Message, Is.EqualTo("en-US content"));
        Assert.That(resultDa.Messages.First().Message, Is.EqualTo("da-DK content"));
    }

    [Test]
    public async Task GetOrSetAsync_WithDifferentCultures_DoesNotShareCache()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var enCallCount = 0;
        var daCallCount = 0;

        // Act - Call same doc, different cultures
        await _sut.GetOrSetAsync(documentId, "en-US", async (ct) =>
        {
            enCallCount++;
            return await new ValueTask<ValidationResponse>(CreateValidationResponse(documentId));
        });

        await _sut.GetOrSetAsync(documentId, "da-DK", async (ct) =>
        {
            daCallCount++;
            return await new ValueTask<ValidationResponse>(CreateValidationResponse(documentId));
        });

        // Assert - Both factories should be called (different cache keys)
        Assert.That(enCallCount, Is.EqualTo(1));
        Assert.That(daCallCount, Is.EqualTo(1));
    }

    #endregion

    #region ClearForDocumentCultureAsync Tests

    [Test]
    public async Task ClearForDocumentCultureAsync_RemovesSpecificCultureCache()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var enCallCount = 0;
        var daCallCount = 0;

        // Pre-populate both caches
        await _sut.GetOrSetAsync(documentId, "en-US",
            async (ct) => await new ValueTask<ValidationResponse>(CreateValidationResponse(documentId)));
        await _sut.GetOrSetAsync(documentId, "da-DK",
            async (ct) => await new ValueTask<ValidationResponse>(CreateValidationResponse(documentId)));

        // Act - Clear only en-US
        await _sut.ClearForDocumentCultureAsync(documentId, "en-US");

        // Assert - en-US factory should be called again, da-DK should use cache
        await _sut.GetOrSetAsync(documentId, "en-US", async (ct) =>
        {
            enCallCount++;
            return await new ValueTask<ValidationResponse>(CreateValidationResponse(documentId));
        });

        await _sut.GetOrSetAsync(documentId, "da-DK", async (ct) =>
        {
            daCallCount++;
            return await new ValueTask<ValidationResponse>(CreateValidationResponse(documentId));
        });

        Assert.That(enCallCount, Is.EqualTo(1), "en-US cache should be cleared");
        Assert.That(daCallCount, Is.EqualTo(0), "da-DK cache should still exist");
    }

    [Test]
    public async Task ClearForDocumentCultureAsync_WithInvariant_ClearsInvariantOnly()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var invariantCallCount = 0;
        var cultureCallCount = 0;

        // Pre-populate both
        await _sut.GetOrSetAsync(documentId, null,
            async (ct) => await new ValueTask<ValidationResponse>(CreateValidationResponse(documentId)));
        await _sut.GetOrSetAsync(documentId, "en-US",
            async (ct) => await new ValueTask<ValidationResponse>(CreateValidationResponse(documentId)));

        // Act - Clear invariant only
        await _sut.ClearForDocumentCultureAsync(documentId, null);

        // Assert
        await _sut.GetOrSetAsync(documentId, null, async (ct) =>
        {
            invariantCallCount++;
            return await new ValueTask<ValidationResponse>(CreateValidationResponse(documentId));
        });

        await _sut.GetOrSetAsync(documentId, "en-US", async (ct) =>
        {
            cultureCallCount++;
            return await new ValueTask<ValidationResponse>(CreateValidationResponse(documentId));
        });

        Assert.That(invariantCallCount, Is.EqualTo(1), "Invariant should be cleared");
        Assert.That(cultureCallCount, Is.EqualTo(0), "Culture cache should still exist");
    }

    [Test]
    public async Task ClearForDocumentCultureAsync_WhenNotCached_DoesNotThrow()
    {
        // Arrange
        var documentId = Guid.NewGuid();

        // Act & Assert
        Assert.DoesNotThrowAsync(async () =>
            await _sut.ClearForDocumentCultureAsync(documentId, "en-US"));
    }

    #endregion

    #region ClearForDocumentAsync Tests

    [Test]
    public async Task ClearForDocumentAsync_RemovesAllCulturesForDocument()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var invariantCallCount = 0;
        var enCallCount = 0;
        var daCallCount = 0;

        // Pre-populate multiple cultures
        await _sut.GetOrSetAsync(documentId, null,
            async (ct) => await new ValueTask<ValidationResponse>(CreateValidationResponse(documentId)));
        await _sut.GetOrSetAsync(documentId, "en-US",
            async (ct) => await new ValueTask<ValidationResponse>(CreateValidationResponse(documentId)));
        await _sut.GetOrSetAsync(documentId, "da-DK",
            async (ct) => await new ValueTask<ValidationResponse>(CreateValidationResponse(documentId)));

        // Act - Clear all cultures for document
        await _sut.ClearForDocumentAsync(documentId);

        // Assert - All factories should be called (all caches cleared)
        await _sut.GetOrSetAsync(documentId, null, async (ct) =>
        {
            invariantCallCount++;
            return await new ValueTask<ValidationResponse>(CreateValidationResponse(documentId));
        });

        await _sut.GetOrSetAsync(documentId, "en-US", async (ct) =>
        {
            enCallCount++;
            return await new ValueTask<ValidationResponse>(CreateValidationResponse(documentId));
        });

        await _sut.GetOrSetAsync(documentId, "da-DK", async (ct) =>
        {
            daCallCount++;
            return await new ValueTask<ValidationResponse>(CreateValidationResponse(documentId));
        });

        Assert.That(invariantCallCount, Is.EqualTo(1));
        Assert.That(enCallCount, Is.EqualTo(1));
        Assert.That(daCallCount, Is.EqualTo(1));
    }

    [Test]
    public async Task ClearForDocumentAsync_DoesNotAffectOtherDocuments()
    {
        // Arrange
        var document1 = Guid.NewGuid();
        var document2 = Guid.NewGuid();
        var doc1CallCount = 0;
        var doc2CallCount = 0;

        // Pre-populate both documents
        await _sut.GetOrSetAsync(document1, "en-US",
            async (ct) => await new ValueTask<ValidationResponse>(CreateValidationResponse(document1)));
        await _sut.GetOrSetAsync(document2, "en-US",
            async (ct) => await new ValueTask<ValidationResponse>(CreateValidationResponse(document2)));

        // Act - Clear only document1
        await _sut.ClearForDocumentAsync(document1);

        // Assert
        await _sut.GetOrSetAsync(document1, "en-US", async (ct) =>
        {
            doc1CallCount++;
            return await new ValueTask<ValidationResponse>(CreateValidationResponse(document1));
        });

        await _sut.GetOrSetAsync(document2, "en-US", async (ct) =>
        {
            doc2CallCount++;
            return await new ValueTask<ValidationResponse>(CreateValidationResponse(document2));
        });

        Assert.That(doc1CallCount, Is.EqualTo(1), "Document 1 cache should be cleared");
        Assert.That(doc2CallCount, Is.EqualTo(0), "Document 2 cache should still exist");
    }

    #endregion

    #region ClearAllAsync Tests

    [Test]
    public async Task ClearAllAsync_RemovesAllCachedDocuments()
    {
        // Arrange
        var doc1 = Guid.NewGuid();
        var doc2 = Guid.NewGuid();
        var doc1CallCount = 0;
        var doc2CallCount = 0;

        // Pre-populate multiple documents with multiple cultures
        await _sut.GetOrSetAsync(doc1, "en-US",
            async (ct) => await new ValueTask<ValidationResponse>(CreateValidationResponse(doc1)));
        await _sut.GetOrSetAsync(doc1, "da-DK",
            async (ct) => await new ValueTask<ValidationResponse>(CreateValidationResponse(doc1)));
        await _sut.GetOrSetAsync(doc2, "en-US",
            async (ct) => await new ValueTask<ValidationResponse>(CreateValidationResponse(doc2)));

        // Act - Clear all
        await _sut.ClearAllAsync();

        // Assert - All factories should be called (all caches cleared)
        await _sut.GetOrSetAsync(doc1, "en-US", async (ct) =>
        {
            doc1CallCount++;
            return await new ValueTask<ValidationResponse>(CreateValidationResponse(doc1));
        });

        await _sut.GetOrSetAsync(doc2, "en-US", async (ct) =>
        {
            doc2CallCount++;
            return await new ValueTask<ValidationResponse>(CreateValidationResponse(doc2));
        });

        Assert.That(doc1CallCount, Is.EqualTo(1));
        Assert.That(doc2CallCount, Is.EqualTo(1));
    }

    [Test]
    public async Task ClearAllAsync_WhenCacheEmpty_DoesNotThrow()
    {
        // Act & Assert
        Assert.DoesNotThrowAsync(async () => await _sut.ClearAllAsync());
    }

    [Test]
    public async Task ClearAllAsync_LogsInformation()
    {
        // Arrange
        await _sut.GetOrSetAsync(Guid.NewGuid(), null,
            async (ct) => await new ValueTask<ValidationResponse>(CreateValidationResponse(Guid.NewGuid())));

        // Act
        await _sut.ClearAllAsync();

        // Assert
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Cleared all validation cache")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region Cache Disabled Tests

    [Test]
    public async Task GetOrSetAsync_WhenCachingDisabled_AlwaysCallsFactory()
    {
        // Arrange
        _options.CacheExpirationMinutes = 0;
        var documentId = Guid.NewGuid();
        var factoryCallCount = 0;

        // Act - Call twice
        await _sut.GetOrSetAsync(documentId, null, async (ct) =>
        {
            factoryCallCount++;
            return await new ValueTask<ValidationResponse>(CreateValidationResponse(documentId));
        });

        await _sut.GetOrSetAsync(documentId, null, async (ct) =>
        {
            factoryCallCount++;
            return await new ValueTask<ValidationResponse>(CreateValidationResponse(documentId));
        });

        // Assert - Factory should be called twice (no caching)
        Assert.That(factoryCallCount, Is.EqualTo(2));
    }

    [Test]
    public async Task GetOrSetAsync_WhenCachingDisabled_LogsDebugMessage()
    {
        // Arrange
        _options.CacheExpirationMinutes = 0;
        var documentId = Guid.NewGuid();

        // Act
        await _sut.GetOrSetAsync(documentId, null,
            async (ct) => await new ValueTask<ValidationResponse>(CreateValidationResponse(documentId)));

        // Assert
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Debug,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Caching disabled")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion

    #region Tag-Based Invalidation Tests

    [Test]
    public async Task ClearForDocumentAsync_ClearsAllCulturesForDocument()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var enCallCount = 0;
        var daCallCount = 0;

        // Pre-populate
        await _sut.GetOrSetAsync(documentId, "en-US",
            async (ct) => await new ValueTask<ValidationResponse>(CreateValidationResponse(documentId)));
        await _sut.GetOrSetAsync(documentId, "da-DK",
            async (ct) => await new ValueTask<ValidationResponse>(CreateValidationResponse(documentId)));

        // Act - Clear all cultures for document
        await _sut.ClearForDocumentAsync(documentId);

        // Assert - Both should be cleared
        await _sut.GetOrSetAsync(documentId, "en-US", async (ct) =>
        {
            enCallCount++;
            return await new ValueTask<ValidationResponse>(CreateValidationResponse(documentId));
        });

        await _sut.GetOrSetAsync(documentId, "da-DK", async (ct) =>
        {
            daCallCount++;
            return await new ValueTask<ValidationResponse>(CreateValidationResponse(documentId));
        });

        Assert.That(enCallCount, Is.EqualTo(1), "en-US should be cleared");
        Assert.That(daCallCount, Is.EqualTo(1), "da-DK should be cleared");
    }

    [Test]
    public async Task ClearAllAsync_ClearsAllDocuments()
    {
        // Arrange
        var doc1 = Guid.NewGuid();
        var doc2 = Guid.NewGuid();
        var doc1CallCount = 0;
        var doc2CallCount = 0;

        // Pre-populate multiple documents
        await _sut.GetOrSetAsync(doc1, null,
            async (ct) => await new ValueTask<ValidationResponse>(CreateValidationResponse(doc1)));
        await _sut.GetOrSetAsync(doc2, null,
            async (ct) => await new ValueTask<ValidationResponse>(CreateValidationResponse(doc2)));

        // Act
        await _sut.ClearAllAsync();

        // Assert - All should be cleared
        await _sut.GetOrSetAsync(doc1, null, async (ct) =>
        {
            doc1CallCount++;
            return await new ValueTask<ValidationResponse>(CreateValidationResponse(doc1));
        });

        await _sut.GetOrSetAsync(doc2, null, async (ct) =>
        {
            doc2CallCount++;
            return await new ValueTask<ValidationResponse>(CreateValidationResponse(doc2));
        });

        Assert.That(doc1CallCount, Is.EqualTo(1));
        Assert.That(doc2CallCount, Is.EqualTo(1));
    }

    #endregion

    #region Concurrent Access Tests

    [Test]
    public async Task GetOrSetAsync_ConcurrentCalls_ThreadSafe()
    {
        // Arrange
        var documentId = Guid.NewGuid();
        var factoryCallCount = 0;
        var lockObject = new object();

        // Act - Multiple concurrent calls for same key
        var tasks = Enumerable.Range(0, 10).Select(_ =>
            _sut.GetOrSetAsync(documentId, null, async (ct) =>
            {
                lock (lockObject)
                {
                    factoryCallCount++;
                }
                await Task.Delay(10, ct); // Simulate work
                return await new ValueTask<ValidationResponse>(CreateValidationResponse(documentId));
            })
        ).ToArray();

        await Task.WhenAll(tasks);

        // Assert - Factory should only be called once (HybridCache stampede protection)
        Assert.That(factoryCallCount, Is.EqualTo(1),
            "Factory should only execute once despite concurrent calls");
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