using Microsoft.Extensions.DependencyInjection;
using Moq;
using NUnit.Framework;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Community.CustomValidator.Extensions;
using Umbraco.Community.CustomValidator.Interfaces;
using Umbraco.Community.CustomValidator.Models;

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
        _umbracoBuilderMock.Object.AddDocumentValidator<TestValidator>();
        var serviceProvider = _services.BuildServiceProvider();

        // Assert - Get twice and verify same instance
        var instance1 = serviceProvider.GetRequiredService<TestValidator>();
        var instance2 = serviceProvider.GetRequiredService<TestValidator>();

        Assert.That(instance1, Is.SameAs(instance2));
    }

    [Test]
    public void AddDocumentValidator_RegistersAsIDocumentValidator()
    {
        // Act
        _umbracoBuilderMock.Object.AddDocumentValidator<TestValidator>();
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var validator = serviceProvider.GetRequiredService<IDocumentValidator>();
        Assert.That(validator, Is.InstanceOf<TestValidator>());
    }

    [Test]
    public void AddDocumentValidator_BothRegistrationsReturnSameInstance()
    {
        // Act
        _umbracoBuilderMock.Object.AddDocumentValidator<TestValidator>();
        var serviceProvider = _services.BuildServiceProvider();

        // Assert - Concrete and interface should resolve to same instance
        var concrete = serviceProvider.GetRequiredService<TestValidator>();
        var interface1 = serviceProvider.GetRequiredService<IDocumentValidator>();

        Assert.That(interface1, Is.SameAs(concrete));
    }

    [Test]
    public void AddDocumentValidator_ReturnsBuilder()
    {
        // Act
        var result = _umbracoBuilderMock.Object.AddDocumentValidator<TestValidator>();

        // Assert
        Assert.That(result, Is.SameAs(_umbracoBuilderMock.Object));
    }

    #endregion

    #region IUmbracoBuilder Extensions - With Lifetime

    [Test]
    public void AddDocumentValidator_WithSingletonLifetime_RegistersAsSingleton()
    {
        // Act
        _umbracoBuilderMock.Object.AddDocumentValidator<TestValidator>(ServiceLifetime.Singleton);
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
        _umbracoBuilderMock.Object.AddDocumentValidator<TestValidator>(ServiceLifetime.Scoped);
        var serviceProvider = _services.BuildServiceProvider();

        // Assert - Same within scope, different across scopes
        using (var scope1 = serviceProvider.CreateScope())
        {
            var instance1 = scope1.ServiceProvider.GetRequiredService<TestValidator>();
            var instance2 = scope1.ServiceProvider.GetRequiredService<TestValidator>();
            Assert.That(instance1, Is.SameAs(instance2));
        }

        using (var scope2 = serviceProvider.CreateScope())
        {
            var instance3 = scope2.ServiceProvider.GetRequiredService<TestValidator>();

            using (var scope1 = serviceProvider.CreateScope())
            {
                var instance1 = scope1.ServiceProvider.GetRequiredService<TestValidator>();
                Assert.That(instance3, Is.Not.SameAs(instance1));
            }
        }
    }

    [Test]
    public void AddDocumentValidator_WithTransientLifetime_RegistersAsTransient()
    {
        // Act
        _umbracoBuilderMock.Object.AddDocumentValidator<TestValidator>(ServiceLifetime.Transient);
        var serviceProvider = _services.BuildServiceProvider();

        // Assert - Different instances each time
        var instance1 = serviceProvider.GetRequiredService<TestValidator>();
        var instance2 = serviceProvider.GetRequiredService<TestValidator>();

        Assert.That(instance1, Is.Not.SameAs(instance2));
    }

    #endregion

    #region IUmbracoBuilder Extensions - Scoped

    [Test]
    public void AddScopedDocumentValidator_RegistersAsScoped()
    {
        // Act
        _umbracoBuilderMock.Object.AddScopedDocumentValidator<TestValidator>();
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        using (var scope1 = serviceProvider.CreateScope())
        {
            var instance1 = scope1.ServiceProvider.GetRequiredService<TestValidator>();
            var instance2 = scope1.ServiceProvider.GetRequiredService<TestValidator>();
            Assert.That(instance1, Is.SameAs(instance2), "Should be same within scope");
        }

        using (var scope2 = serviceProvider.CreateScope())
        {
            var instance3 = scope2.ServiceProvider.GetRequiredService<TestValidator>();

            using (var scope1 = serviceProvider.CreateScope())
            {
                var instance1 = scope1.ServiceProvider.GetRequiredService<TestValidator>();
                Assert.That(instance3, Is.Not.SameAs(instance1), "Should be different across scopes");
            }
        }
    }

    [Test]
    public void AddScopedDocumentValidator_ReturnsBuilder()
    {
        // Act
        var result = _umbracoBuilderMock.Object.AddScopedDocumentValidator<TestValidator>();

        // Assert
        Assert.That(result, Is.SameAs(_umbracoBuilderMock.Object));
    }

    #endregion

    #region IUmbracoBuilder Extensions - Transient

    [Test]
    public void AddTransientDocumentValidator_RegistersAsTransient()
    {
        // Act
        _umbracoBuilderMock.Object.AddTransientDocumentValidator<TestValidator>();
        var serviceProvider = _services.BuildServiceProvider();

        // Assert - New instance each time
        var instance1 = serviceProvider.GetRequiredService<TestValidator>();
        var instance2 = serviceProvider.GetRequiredService<TestValidator>();

        Assert.That(instance1, Is.Not.SameAs(instance2));
    }

    [Test]
    public void AddTransientDocumentValidator_ReturnsBuilder()
    {
        // Act
        var result = _umbracoBuilderMock.Object.AddTransientDocumentValidator<TestValidator>();

        // Assert
        Assert.That(result, Is.SameAs(_umbracoBuilderMock.Object));
    }

    #endregion

    #region IServiceCollection Extensions - Singleton

    [Test]
    public void ServiceCollection_AddDocumentValidator_RegistersAsSingleton()
    {
        // Act
        _services.AddDocumentValidator<TestValidator>();
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
        _services.AddDocumentValidator<TestValidator>();
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var validator = serviceProvider.GetRequiredService<IDocumentValidator>();
        Assert.That(validator, Is.InstanceOf<TestValidator>());
    }

    [Test]
    public void ServiceCollection_AddDocumentValidator_ReturnsServiceCollection()
    {
        // Act
        var result = _services.AddDocumentValidator<TestValidator>();

        // Assert
        Assert.That(result, Is.SameAs(_services));
    }

    #endregion

    #region IServiceCollection Extensions - With Lifetime

    [Test]
    public void ServiceCollection_AddDocumentValidator_WithScopedLifetime_RegistersAsScoped()
    {
        // Act
        _services.AddDocumentValidator<TestValidator>(ServiceLifetime.Scoped);
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
        _services.AddDocumentValidator<TestValidator>(ServiceLifetime.Transient);
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
        _services.AddScopedDocumentValidator<TestValidator>();
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
    public void ServiceCollection_AddScopedDocumentValidator_ReturnsServiceCollection()
    {
        // Act
        var result = _services.AddScopedDocumentValidator<TestValidator>();

        // Assert
        Assert.That(result, Is.SameAs(_services));
    }

    #endregion

    #region IServiceCollection Extensions - Transient

    [Test]
    public void ServiceCollection_AddTransientDocumentValidator_RegistersAsTransient()
    {
        // Act
        _services.AddTransientDocumentValidator<TestValidator>();
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var instance1 = serviceProvider.GetRequiredService<TestValidator>();
        var instance2 = serviceProvider.GetRequiredService<TestValidator>();

        Assert.That(instance1, Is.Not.SameAs(instance2));
    }

    [Test]
    public void ServiceCollection_AddTransientDocumentValidator_ReturnsServiceCollection()
    {
        // Act
        var result = _services.AddTransientDocumentValidator<TestValidator>();

        // Assert
        Assert.That(result, Is.SameAs(_services));
    }

    #endregion

    #region Multiple Validators

    [Test]
    public void AddDocumentValidator_MultipleValidators_AllRegistered()
    {
        // Act
        _umbracoBuilderMock.Object.AddDocumentValidator<TestValidator>();
        _umbracoBuilderMock.Object.AddDocumentValidator<TestValidator2>();
        var serviceProvider = _services.BuildServiceProvider();

        // Assert
        var validators = serviceProvider.GetServices<IDocumentValidator>().ToList();
        Assert.That(validators, Has.Count.EqualTo(2));
        Assert.That(validators.Any(v => v is TestValidator), Is.True);
        Assert.That(validators.Any(v => v is TestValidator2), Is.True);
    }

    [Test]
    public void AddDocumentValidator_MixedLifetimes_RegistersCorrectly()
    {
        // Act
        _umbracoBuilderMock.Object.AddDocumentValidator<TestValidator>(); // Singleton
        _umbracoBuilderMock.Object.AddScopedDocumentValidator<TestValidator2>(); // Scoped
        var serviceProvider = _services.BuildServiceProvider();

        // Assert - Singleton behavior
        var singleton1 = serviceProvider.GetServices<IDocumentValidator>()
            .OfType<TestValidator>().First();
        var singleton2 = serviceProvider.GetServices<IDocumentValidator>()
            .OfType<TestValidator>().First();
        Assert.That(singleton1, Is.SameAs(singleton2));

        // Assert - Scoped behavior
        using (var scope1 = serviceProvider.CreateScope())
        using (var scope2 = serviceProvider.CreateScope())
        {
            var scoped1 = scope1.ServiceProvider.GetServices<IDocumentValidator>()
                .OfType<TestValidator2>().First();
            var scoped2 = scope2.ServiceProvider.GetServices<IDocumentValidator>()
                .OfType<TestValidator2>().First();

            Assert.That(scoped1, Is.Not.SameAs(scoped2));
        }
    }

    #endregion

    #region Test Validators

    private class TestValidator : IDocumentValidator
    {
        public string NameOfType => "Test";

        public Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
        {
            return Task.FromResult<IEnumerable<ValidationMessage>>(new List<ValidationMessage>());
        }
    }

    private class TestValidator2 : IDocumentValidator
    {
        public string NameOfType => "Test2";

        public Task<IEnumerable<ValidationMessage>> ValidateAsync(IPublishedContent content)
        {
            return Task.FromResult<IEnumerable<ValidationMessage>>(new List<ValidationMessage>());
        }
    }

    #endregion
}
