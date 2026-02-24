using Microsoft.Extensions.DependencyInjection;
using Moq;
using NUnit.Framework;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Community.CustomValidator.Extensions;
using Umbraco.Community.CustomValidator.Interfaces;
using Umbraco.Community.CustomValidator.Models;
using Umbraco.Community.CustomValidator.Validation;

namespace Umbraco.Community.CustomValidator.Tests.Extensions;

[TestFixture]
public class ValidatorBuilderExtensionsTests
{
    private ServiceCollection _services = null!;
    private Mock<IUmbracoBuilder> _umbracoBuilderMock = null!;

    [SetUp]
    public void Setup()
    {
        _services = new ServiceCollection();
        _umbracoBuilderMock = new Mock<IUmbracoBuilder>();
        _umbracoBuilderMock.Setup(x => x.Services).Returns(_services);
    }

    #region IUmbracoBuilder Extensions - Singleton

    [Test]
    public void AddDocumentValidator_RegistersValidatorAsSingleton()
    {
        // Act
        _umbracoBuilderMock.Object.AddDocumentValidator<TestValidator, IHomePage>();
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var instance1 = serviceProvider.GetRequiredService<TestValidator>();
        var instance2 = serviceProvider.GetRequiredService<TestValidator>();

        Assert.That(instance1, Is.SameAs(instance2));
    }

    [Test]
    public void AddDocumentValidator_RegistersAsIDocumentValidator()
    {
        // Act
        _umbracoBuilderMock.Object.AddDocumentValidator<TestValidator, IHomePage>();
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var validator = serviceProvider.GetRequiredService<IDocumentValidator>();
        Assert.That(validator, Is.InstanceOf<TestValidator>());
    }

    [Test]
    public void AddDocumentValidator_RegistersMetadata()
    {
        // Act
        _umbracoBuilderMock.Object.AddDocumentValidator<TestValidator, IHomePage>();
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var metadata = serviceProvider.GetServices<ValidatorMetadata>().ToList();
        Assert.That(metadata, Has.Count.EqualTo(1));
        Assert.That(metadata[0].ValidatorType, Is.EqualTo(typeof(TestValidator)));
        Assert.That(metadata[0].ContentType, Is.EqualTo(typeof(IHomePage)));
    }

    [Test]
    public void AddDocumentValidator_BothRegistrationsReturnSameInstance()
    {
        // Act
        _umbracoBuilderMock.Object.AddDocumentValidator<TestValidator, IHomePage>();
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var concrete = serviceProvider.GetRequiredService<TestValidator>();
        var interface1 = serviceProvider.GetRequiredService<IDocumentValidator>();

        Assert.That(interface1, Is.SameAs(concrete));
    }

    [Test]
    public void AddDocumentValidator_ReturnsBuilder()
    {
        // Act
        var result = _umbracoBuilderMock.Object.AddDocumentValidator<TestValidator, IHomePage>();

        // Assert
        Assert.That(result, Is.SameAs(_umbracoBuilderMock.Object));
    }

    #endregion

    #region IUmbracoBuilder Extensions - With Lifetime

    [Test]
    public void AddDocumentValidator_WithSingletonLifetime_RegistersAsSingleton()
    {
        // Act
        _umbracoBuilderMock.Object.AddDocumentValidator<TestValidator, IHomePage>(ServiceLifetime.Singleton);
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var instance1 = serviceProvider.GetRequiredService<TestValidator>();
        var instance2 = serviceProvider.GetRequiredService<TestValidator>();

        Assert.That(instance1, Is.SameAs(instance2));
    }

    [Test]
    public void AddDocumentValidator_WithScopedLifetime_RegistersAsScoped()
    {
        // Act
        _umbracoBuilderMock.Object.AddDocumentValidator<TestValidator, IHomePage>(ServiceLifetime.Scoped);
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        using (var scope1 = serviceProvider.CreateScope())
        {
            var instance1 = scope1.ServiceProvider.GetRequiredService<TestValidator>();
            var instance2 = scope1.ServiceProvider.GetRequiredService<TestValidator>();
            Assert.That(instance1, Is.SameAs(instance2), "Same within scope");
        }

        using (var scope2 = serviceProvider.CreateScope())
        using (var scope3 = serviceProvider.CreateScope())
        {
            var instance2 = scope2.ServiceProvider.GetRequiredService<TestValidator>();
            var instance3 = scope3.ServiceProvider.GetRequiredService<TestValidator>();
            Assert.That(instance2, Is.Not.SameAs(instance3), "Different across scopes");
        }
    }

    [Test]
    public void AddDocumentValidator_WithTransientLifetime_RegistersAsTransient()
    {
        // Act
        _umbracoBuilderMock.Object.AddDocumentValidator<TestValidator, IHomePage>(ServiceLifetime.Transient);
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var instance1 = serviceProvider.GetRequiredService<TestValidator>();
        var instance2 = serviceProvider.GetRequiredService<TestValidator>();

        Assert.That(instance1, Is.Not.SameAs(instance2));
    }

    [Test]
    public void AddDocumentValidator_WithLifetime_RegistersMetadata()
    {
        // Act
        _umbracoBuilderMock.Object.AddDocumentValidator<TestValidator, IHomePage>(ServiceLifetime.Scoped);
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var metadata = serviceProvider.GetServices<ValidatorMetadata>().ToList();
        Assert.That(metadata, Has.Count.EqualTo(1));
        Assert.That(metadata[0].ContentType, Is.EqualTo(typeof(IHomePage)));
    }

    #endregion

    #region IUmbracoBuilder Extensions - Scoped

    [Test]
    public void AddScopedDocumentValidator_RegistersAsScoped()
    {
        // Act
        _umbracoBuilderMock.Object.AddScopedDocumentValidator<TestValidator, IHomePage>();
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        using (var scope1 = serviceProvider.CreateScope())
        {
            var instance1 = scope1.ServiceProvider.GetRequiredService<TestValidator>();
            var instance2 = scope1.ServiceProvider.GetRequiredService<TestValidator>();
            Assert.That(instance1, Is.SameAs(instance2), "Same within scope");
        }

        using (var scope2 = serviceProvider.CreateScope())
        using (var scope3 = serviceProvider.CreateScope())
        {
            var instance2 = scope2.ServiceProvider.GetRequiredService<TestValidator>();
            var instance3 = scope3.ServiceProvider.GetRequiredService<TestValidator>();
            Assert.That(instance2, Is.Not.SameAs(instance3), "Different across scopes");
        }
    }

    [Test]
    public void AddScopedDocumentValidator_RegistersMetadata()
    {
        // Act
        _umbracoBuilderMock.Object.AddScopedDocumentValidator<TestValidator, IHomePage>();
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var metadata = serviceProvider.GetServices<ValidatorMetadata>().Single();
        Assert.That(metadata.ValidatorType, Is.EqualTo(typeof(TestValidator)));
        Assert.That(metadata.ContentType, Is.EqualTo(typeof(IHomePage)));
    }

    [Test]
    public void AddScopedDocumentValidator_ReturnsBuilder()
    {
        // Act
        var result = _umbracoBuilderMock.Object.AddScopedDocumentValidator<TestValidator, IHomePage>();

        // Assert
        Assert.That(result, Is.SameAs(_umbracoBuilderMock.Object));
    }

    #endregion

    #region IUmbracoBuilder Extensions - Transient

    [Test]
    public void AddTransientDocumentValidator_RegistersAsTransient()
    {
        // Act
        _umbracoBuilderMock.Object.AddTransientDocumentValidator<TestValidator, IHomePage>();
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var instance1 = serviceProvider.GetRequiredService<TestValidator>();
        var instance2 = serviceProvider.GetRequiredService<TestValidator>();

        Assert.That(instance1, Is.Not.SameAs(instance2));
    }

    [Test]
    public void AddTransientDocumentValidator_RegistersMetadata()
    {
        // Act
        _umbracoBuilderMock.Object.AddTransientDocumentValidator<TestValidator, IHomePage>();
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var metadata = serviceProvider.GetServices<ValidatorMetadata>().Single();
        Assert.That(metadata.ValidatorType, Is.EqualTo(typeof(TestValidator)));
        Assert.That(metadata.ContentType, Is.EqualTo(typeof(IHomePage)));
    }

    [Test]
    public void AddTransientDocumentValidator_ReturnsBuilder()
    {
        // Act
        var result = _umbracoBuilderMock.Object.AddTransientDocumentValidator<TestValidator, IHomePage>();

        // Assert
        Assert.That(result, Is.SameAs(_umbracoBuilderMock.Object));
    }

    #endregion

    #region IServiceCollection Extensions - Singleton

    [Test]
    public void ServiceCollection_AddDocumentValidator_RegistersAsSingleton()
    {
        // Act
        _services.AddDocumentValidator<TestValidator, IHomePage>();
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var instance1 = serviceProvider.GetRequiredService<TestValidator>();
        var instance2 = serviceProvider.GetRequiredService<TestValidator>();

        Assert.That(instance1, Is.SameAs(instance2));
    }

    [Test]
    public void ServiceCollection_AddDocumentValidator_RegistersAsIDocumentValidator()
    {
        // Act
        _services.AddDocumentValidator<TestValidator, IHomePage>();
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var validator = serviceProvider.GetRequiredService<IDocumentValidator>();
        Assert.That(validator, Is.InstanceOf<TestValidator>());
    }

    [Test]
    public void ServiceCollection_AddDocumentValidator_RegistersMetadata()
    {
        // Act
        _services.AddDocumentValidator<TestValidator, IHomePage>();
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var metadata = serviceProvider.GetServices<ValidatorMetadata>().Single();
        Assert.That(metadata.ValidatorType, Is.EqualTo(typeof(TestValidator)));
        Assert.That(metadata.ContentType, Is.EqualTo(typeof(IHomePage)));
    }

    [Test]
    public void ServiceCollection_AddDocumentValidator_ReturnsServiceCollection()
    {
        // Act
        var result = _services.AddDocumentValidator<TestValidator, IHomePage>();

        // Assert
        Assert.That(result, Is.SameAs(_services));
    }

    #endregion

    #region IServiceCollection Extensions - With Lifetime

    [Test]
    public void ServiceCollection_AddDocumentValidator_WithScopedLifetime_RegistersAsScoped()
    {
        // Act
        _services.AddDocumentValidator<TestValidator, IHomePage>(ServiceLifetime.Scoped);
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        using (var scope = serviceProvider.CreateScope())
        {
            var instance1 = scope.ServiceProvider.GetRequiredService<TestValidator>();
            var instance2 = scope.ServiceProvider.GetRequiredService<TestValidator>();
            Assert.That(instance1, Is.SameAs(instance2));
        }
    }

    [Test]
    public void ServiceCollection_AddDocumentValidator_WithTransientLifetime_RegistersAsTransient()
    {
        // Act
        _services.AddDocumentValidator<TestValidator, IHomePage>(ServiceLifetime.Transient);
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var instance1 = serviceProvider.GetRequiredService<TestValidator>();
        var instance2 = serviceProvider.GetRequiredService<TestValidator>();

        Assert.That(instance1, Is.Not.SameAs(instance2));
    }

    #endregion

    #region IServiceCollection Extensions - Scoped

    [Test]
    public void ServiceCollection_AddScopedDocumentValidator_RegistersAsScoped()
    {
        // Act
        _services.AddScopedDocumentValidator<TestValidator, IHomePage>();
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        using (var scope = serviceProvider.CreateScope())
        {
            var instance1 = scope.ServiceProvider.GetRequiredService<TestValidator>();
            var instance2 = scope.ServiceProvider.GetRequiredService<TestValidator>();
            Assert.That(instance1, Is.SameAs(instance2));
        }
    }

    [Test]
    public void ServiceCollection_AddScopedDocumentValidator_RegistersMetadata()
    {
        // Act
        _services.AddScopedDocumentValidator<TestValidator, IHomePage>();
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var metadata = serviceProvider.GetServices<ValidatorMetadata>().Single();
        Assert.That(metadata.ContentType, Is.EqualTo(typeof(IHomePage)));
    }

    [Test]
    public void ServiceCollection_AddScopedDocumentValidator_ReturnsServiceCollection()
    {
        // Act
        var result = _services.AddScopedDocumentValidator<TestValidator, IHomePage>();

        // Assert
        Assert.That(result, Is.SameAs(_services));
    }

    #endregion

    #region IServiceCollection Extensions - Transient

    [Test]
    public void ServiceCollection_AddTransientDocumentValidator_RegistersAsTransient()
    {
        // Act
        _services.AddTransientDocumentValidator<TestValidator, IHomePage>();
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var instance1 = serviceProvider.GetRequiredService<TestValidator>();
        var instance2 = serviceProvider.GetRequiredService<TestValidator>();

        Assert.That(instance1, Is.Not.SameAs(instance2));
    }

    [Test]
    public void ServiceCollection_AddTransientDocumentValidator_RegistersMetadata()
    {
        // Act
        _services.AddTransientDocumentValidator<TestValidator, IHomePage>();
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var metadata = serviceProvider.GetServices<ValidatorMetadata>().Single();
        Assert.That(metadata.ContentType, Is.EqualTo(typeof(IHomePage)));
    }

    [Test]
    public void ServiceCollection_AddTransientDocumentValidator_ReturnsServiceCollection()
    {
        // Act
        var result = _services.AddTransientDocumentValidator<TestValidator, IHomePage>();

        // Assert
        Assert.That(result, Is.SameAs(_services));
    }

    #endregion

    #region Multiple Validators Tests

    [Test]
    public void AddDocumentValidator_MultipleValidators_AllRegistered()
    {
        // Act
        _umbracoBuilderMock.Object.AddDocumentValidator<TestValidator, IHomePage>();
        _umbracoBuilderMock.Object.AddDocumentValidator<TestValidator2, IArticle>();
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var validators = serviceProvider.GetServices<IDocumentValidator>().ToList();
        Assert.That(validators, Has.Count.EqualTo(2));
        Assert.That(validators.Any(v => v is TestValidator), Is.True);
        Assert.That(validators.Any(v => v is TestValidator2), Is.True);
    }

    [Test]
    public void AddDocumentValidator_MultipleValidators_AllMetadataRegistered()
    {
        // Act
        _umbracoBuilderMock.Object.AddDocumentValidator<TestValidator, IHomePage>();
        _umbracoBuilderMock.Object.AddDocumentValidator<TestValidator2, IArticle>();
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var metadata = serviceProvider.GetServices<ValidatorMetadata>().ToList();
        Assert.That(metadata, Has.Count.EqualTo(2));
        Assert.That(metadata.Any(m => m.ContentType == typeof(IHomePage)), Is.True);
        Assert.That(metadata.Any(m => m.ContentType == typeof(IArticle)), Is.True);
    }

    [Test]
    public void AddDocumentValidator_MixedLifetimes_RegistersCorrectly()
    {
        // Act
        _umbracoBuilderMock.Object.AddDocumentValidator<TestValidator, IHomePage>(); // Singleton
        _umbracoBuilderMock.Object.AddScopedDocumentValidator<TestValidator2, IArticle>(); // Scoped
        var serviceProvider = _services.BuildServiceProvider();

        // Assert - Singleton behavior
        var singleton1 = serviceProvider.GetRequiredService<TestValidator>();
        var singleton2 = serviceProvider.GetRequiredService<TestValidator>();
        Assert.That(singleton1, Is.SameAs(singleton2));

        // Assert - Scoped behavior
        using (var scope1 = serviceProvider.CreateScope())
        using (var scope2 = serviceProvider.CreateScope())
        {
            var scoped1 = scope1.ServiceProvider.GetRequiredService<TestValidator2>();
            var scoped2 = scope2.ServiceProvider.GetRequiredService<TestValidator2>();

            Assert.That(scoped1, Is.Not.SameAs(scoped2));
        }
    }

    [Test]
    public void AddDocumentValidator_MixedLifetimes_AllMetadataIsSingleton()
    {
        // Act
        _umbracoBuilderMock.Object.AddDocumentValidator<TestValidator, IHomePage>();
        _umbracoBuilderMock.Object.AddScopedDocumentValidator<TestValidator2, IArticle>();
        _umbracoBuilderMock.Object.AddTransientDocumentValidator<TestValidator3, IProduct>();

        var serviceProvider = _services.BuildServiceProvider();

        // Assert - All metadata should be singleton (same instances)
        var metadata1 = serviceProvider.GetServices<ValidatorMetadata>().ToList();
        var metadata2 = serviceProvider.GetServices<ValidatorMetadata>().ToList();

        Assert.That(metadata1, Has.Count.EqualTo(3));
        Assert.That(metadata2, Has.Count.EqualTo(3));

        // Metadata instances should be the same (singleton)
        for (int i = 0; i < 3; i++)
        {
            Assert.That(metadata1[i], Is.SameAs(metadata2[i]));
        }
    }

    #endregion

    #region Test Validators

    private class TestValidator : IDocumentValidator<IHomePage>, IDocumentValidator
    {
        public Task<IEnumerable<ValidationMessage>> ValidateAsync(IHomePage content)
        {
            return Task.FromResult<IEnumerable<ValidationMessage>>(new List<ValidationMessage>());
        }

        public Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
        {
            return ValidateAsync((IHomePage)content);
        }
    }

    private class TestValidator2 : IDocumentValidator<IArticle>, IDocumentValidator
    {

        public Task<IEnumerable<ValidationMessage>> ValidateAsync(IArticle content)
        {
            return Task.FromResult<IEnumerable<ValidationMessage>>(new List<ValidationMessage>());
        }

        public Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
        {
            return ValidateAsync((IArticle)content);
        }
    }

    private class TestValidator3 : IDocumentValidator<IProduct>, IDocumentValidator
    {

        public Task<IEnumerable<ValidationMessage>> ValidateAsync(IProduct content)
        {
            return Task.FromResult<IEnumerable<ValidationMessage>>(new List<ValidationMessage>());
        }

        public Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
        {
            return ValidateAsync((IProduct)content);
        }
    }

    #endregion
}

// Test content type interfaces
public interface IHomePage : IPublishedContent { }
public interface IArticle : IPublishedContent { }
public interface IProduct : IPublishedContent { }