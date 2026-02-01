using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Community.CustomValidator.Interfaces;
using Umbraco.Community.CustomValidator.Models;
using Umbraco.Community.CustomValidator.Validation;

namespace Umbraco.Community.CustomValidator.Tests.Validation;

[TestFixture]
public class ValidatorLookupTests
{
    private Mock<ILogger<ValidatorLookup>> _loggerMock = null!;

    [SetUp]
    public void Setup()
    {
        _loggerMock = new Mock<ILogger<ValidatorLookup>>();
    }

    #region Constructor Tests

    [Test]
    public void Constructor_WithValidMetadata_CreatesInstance()
    {
        // Arrange
        var metadata = new List<ValidatorMetadata>
        {
            new() { ValidatorType = typeof(TestValidator1), ContentType = typeof(IHomePage) }
        };

        // Act
        var lookup = new ValidatorLookup(metadata, _loggerMock.Object);

        // Assert
        Assert.That(lookup, Is.Not.Null);
    }

    [Test]
    public void Constructor_WithNullLogger_ThrowsArgumentNullException()
    {
        // Arrange
        var metadata = new List<ValidatorMetadata>();

        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => new ValidatorLookup(metadata, null!));
    }

    [Test]
    public void Constructor_WithEmptyMetadata_CreatesEmptyLookup()
    {
        // Arrange
        var metadata = new List<ValidatorMetadata>();

        // Act
        var lookup = new ValidatorLookup(metadata, _loggerMock.Object);

        // Assert
        var validators = lookup.GetValidatorsFor(typeof(IHomePage));
        Assert.That(validators, Is.Empty);
    }

    #endregion

    #region GetValidatorsFor - Exact Type Match Tests

    [Test]
    public void GetValidatorsFor_WithExactTypeMatch_ReturnsValidator()
    {
        // Arrange
        var metadata = new List<ValidatorMetadata>
        {
            new() { ValidatorType = typeof(TestValidator1), ContentType = typeof(IHomePage) }
        };
        var lookup = new ValidatorLookup(metadata, _loggerMock.Object);

        // Act
        var validators = lookup.GetValidatorsFor(typeof(IHomePage));

        // Assert
        Assert.That(validators, Has.Count.EqualTo(1));
        Assert.That(validators[0], Is.EqualTo(typeof(TestValidator1)));
    }

    [Test]
    public void GetValidatorsFor_WithNoMatch_ReturnsEmptyList()
    {
        // Arrange
        var metadata = new List<ValidatorMetadata>
        {
            new() { ValidatorType = typeof(TestValidator1), ContentType = typeof(IHomePage) }
        };
        var lookup = new ValidatorLookup(metadata, _loggerMock.Object);

        // Act
        var validators = lookup.GetValidatorsFor(typeof(IArticle));

        // Assert
        Assert.That(validators, Is.Empty);
    }

    [Test]
    public void GetValidatorsFor_WithMultipleValidatorsForSameType_ReturnsAll()
    {
        // Arrange
        var metadata = new List<ValidatorMetadata>
        {
            new() { ValidatorType = typeof(TestValidator1), ContentType = typeof(IHomePage) },
            new() { ValidatorType = typeof(TestValidator2), ContentType = typeof(IHomePage) }
        };
        var lookup = new ValidatorLookup(metadata, _loggerMock.Object);

        // Act
        var validators = lookup.GetValidatorsFor(typeof(IHomePage));

        // Assert
        Assert.That(validators, Has.Count.EqualTo(2));
        Assert.That(validators, Does.Contain(typeof(TestValidator1)));
        Assert.That(validators, Does.Contain(typeof(TestValidator2)));
    }

    #endregion

    #region GetValidatorsFor - Interface Match Tests

    [Test]
    public void GetValidatorsFor_WithInterfaceMatch_ReturnsValidator()
    {
        // Arrange - Validator targets interface
        var metadata = new List<ValidatorMetadata>
        {
            new() { ValidatorType = typeof(TestValidator1), ContentType = typeof(IBasePage) }
        };
        var lookup = new ValidatorLookup(metadata, _loggerMock.Object);

        // Act - Check concrete type that implements interface
        var validators = lookup.GetValidatorsFor(typeof(HomePageWithBase));

        // Assert
        Assert.That(validators, Has.Count.EqualTo(1));
        Assert.That(validators[0], Is.EqualTo(typeof(TestValidator1)));
    }

    [Test]
    public void GetValidatorsFor_WithExactAndInterfaceMatch_ReturnsBoth()
    {
        // Arrange
        var metadata = new List<ValidatorMetadata>
        {
            new() { ValidatorType = typeof(TestValidator1), ContentType = typeof(IHomePage) },
            new() { ValidatorType = typeof(TestValidator2), ContentType = typeof(IBasePage) }
        };
        var lookup = new ValidatorLookup(metadata, _loggerMock.Object);

        // Act - Type implements both IHomePage and IBasePage
        var validators = lookup.GetValidatorsFor(typeof(HomePageWithBase));

        // Assert
        Assert.That(validators, Has.Count.EqualTo(2));
    }

    [Test]
    public void GetValidatorsFor_Deduplicates_WhenSameValidatorMatchedMultipleWays()
    {
        // Arrange - Same validator registered for type and its interface
        var metadata = new List<ValidatorMetadata>
        {
            new() { ValidatorType = typeof(TestValidator1), ContentType = typeof(IHomePage) },
            new() { ValidatorType = typeof(TestValidator1), ContentType = typeof(IBasePage) }
        };
        var lookup = new ValidatorLookup(metadata, _loggerMock.Object);

        // Act
        var validators = lookup.GetValidatorsFor(typeof(HomePageWithBase));

        // Assert - Should only return TestValidator1 once
        Assert.That(validators, Has.Count.EqualTo(1));
        Assert.That(validators[0], Is.EqualTo(typeof(TestValidator1)));
    }

    #endregion

    #region Caching Tests

    [Test]
    public void GetValidatorsFor_CalledTwiceForSameType_UsesCacheOnSecondCall()
    {
        // Arrange
        var metadata = new List<ValidatorMetadata>
        {
            new() { ValidatorType = typeof(TestValidator1), ContentType = typeof(IBasePage) }
        };
        var lookup = new ValidatorLookup(metadata, _loggerMock.Object);

        // Act - Call twice
        var validators1 = lookup.GetValidatorsFor(typeof(HomePageWithBase));
        var validators2 = lookup.GetValidatorsFor(typeof(HomePageWithBase));

        // Assert - Should log debug message only once (first call builds cache)
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Debug,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("matched") && v.ToString()!.Contains("cached")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);

        // Results should be the same instance (cached)
        Assert.That(validators1, Is.SameAs(validators2));
    }

    [Test]
    public void GetValidatorsFor_DifferentTypes_CachesSeparately()
    {
        // Arrange
        var metadata = new List<ValidatorMetadata>
        {
            new() { ValidatorType = typeof(TestValidator1), ContentType = typeof(IHomePage) },
            new() { ValidatorType = typeof(TestValidator2), ContentType = typeof(IArticle) }
        };
        var lookup = new ValidatorLookup(metadata, _loggerMock.Object);

        // Act
        var homeValidators = lookup.GetValidatorsFor(typeof(IHomePage));
        var articleValidators = lookup.GetValidatorsFor(typeof(IArticle));

        // Assert
        Assert.That(homeValidators, Has.Count.EqualTo(1));
        Assert.That(articleValidators, Has.Count.EqualTo(1));
        Assert.That(homeValidators[0], Is.Not.EqualTo(articleValidators[0]));
    }

    #endregion

    #region Thread Safety Tests

    [Test]
    public void GetValidatorsFor_ConcurrentCalls_ThreadSafe()
    {
        // Arrange
        var metadata = new List<ValidatorMetadata>
        {
            new() { ValidatorType = typeof(TestValidator1), ContentType = typeof(IBasePage) }
        };
        var lookup = new ValidatorLookup(metadata, _loggerMock.Object);

        // Act - Concurrent calls for same type
        var tasks = Enumerable.Range(0, 100).Select(_ =>
            Task.Run(() => lookup.GetValidatorsFor(typeof(HomePageWithBase)))
        ).ToArray();

        // Assert - Should not throw
        Assert.DoesNotThrowAsync(async () => await Task.WhenAll(tasks));
    }

    #endregion

    #region Edge Cases

    [Test]
    public void GetValidatorsFor_WithNullType_ThrowsArgumentNullException()
    {
        // Arrange
        var metadata = new List<ValidatorMetadata>();
        var lookup = new ValidatorLookup(metadata, _loggerMock.Object);

        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => lookup.GetValidatorsFor(null!));
    }

    [Test]
    public void GetValidatorsFor_TypeWithNoInterfaces_ReturnsOnlyExactMatch()
    {
        // Arrange
        var metadata = new List<ValidatorMetadata>
        {
            new() { ValidatorType = typeof(TestValidator1), ContentType = typeof(SimpleType) }
        };
        var lookup = new ValidatorLookup(metadata, _loggerMock.Object);

        // Act
        var validators = lookup.GetValidatorsFor(typeof(SimpleType));

        // Assert
        Assert.That(validators, Has.Count.EqualTo(1));
    }

    #endregion

    #region Test Types and Validators

    private class TestValidator1 : IDocumentValidator
    {
        public string NameOfType => "Test";
        public Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
            => Task.FromResult(Enumerable.Empty<ValidationMessage>());
    }

    private class TestValidator2 : IDocumentValidator
    {
        public string NameOfType => "Test";
        public Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
            => Task.FromResult(Enumerable.Empty<ValidationMessage>());
    }

    // Test content type that implements multiple interfaces
    private class HomePageWithBase : IHomePage, IBasePage
    {
        public int Id => 1;
        public string Name => "Test";
        public string? UrlSegment => "test";

        public IPublishedContentType ContentType => null!;
        public PublishedItemType ItemType => PublishedItemType.Content;
        public bool IsDraft(string? culture = null) => false;
        public bool IsPublished(string? culture = null) => true;
        public IReadOnlyDictionary<string, PublishedCultureInfo> Cultures => new Dictionary<string, PublishedCultureInfo>();
        public int? TemplateId => null;
        public int SortOrder => 0;
        public int Level => 1;
        public string Path => "-1,1";
        public Guid Key => Guid.NewGuid();
        public DateTime CreateDate => DateTime.Now;
        public int WriterId { get; }
        public DateTime UpdateDate => DateTime.Now;
        public int CreatorId => 0;
        public int? ParentId => null;
        public IPublishedContent? Parent => null;
        public IEnumerable<IPublishedContent> Children => Enumerable.Empty<IPublishedContent>();
        public IEnumerable<IPublishedContent> ChildrenForAllCultures => Enumerable.Empty<IPublishedContent>();
        public IPublishedProperty? GetProperty(string alias) => null;
        public IEnumerable<IPublishedProperty> Properties => Enumerable.Empty<IPublishedProperty>();
    }

    private class SimpleType { }

    #endregion
}

public interface IArticle : IPublishedContent { }