using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Community.CustomValidator.Interfaces;

namespace Umbraco.Community.CustomValidator.Extensions;

/// <summary>
/// Extension methods for registering document validators with various service lifetimes.
/// </summary>
public static class ValidatorBuilderExtensions
{
    #region IUmbracoBuilder Extensions

    /// <param name="builder">The Umbraco builder</param>
    extension(IUmbracoBuilder builder)
    {
        /// <summary>
        /// Registers a document validator as a singleton
        /// </summary>
        public IUmbracoBuilder AddDocumentValidator<T>()
            where T : class, IDocumentValidator
        {
            builder.Services.AddSingleton<IDocumentValidator, T>();
            return builder;
        }

        /// <summary>
        /// Registers a document validator with a specified service lifetime.
        /// </summary>
        /// <param name="lifetime">The service lifetime (Singleton, Scoped, or Transient)</param>
        public IUmbracoBuilder AddDocumentValidator<T>(ServiceLifetime lifetime)
            where T : class, IDocumentValidator
        {
            builder.Services.Add(new ServiceDescriptor(typeof(IDocumentValidator), typeof(T), lifetime));
            return builder;
        }

        /// <summary>
        /// Registers a document validator as scoped
        /// </summary>
        public IUmbracoBuilder AddScopedDocumentValidator<T>()
            where T : class, IDocumentValidator
        {
            builder.Services.AddScoped<IDocumentValidator, T>();
            return builder;
        }

        /// <summary>
        /// Registers a document validator as transient
        /// </summary>
        public IUmbracoBuilder AddTransientDocumentValidator<T>()
            where T : class, IDocumentValidator
        {
            builder.Services.AddTransient<IDocumentValidator, T>();
            return builder;
        }
    }

    #endregion

    #region IServiceCollection Extensions

    extension(IServiceCollection services)
    {
        /// <summary>
        /// Registers a document validator as a singleton
        /// </summary>
        public IServiceCollection AddDocumentValidator<T>()
            where T : class, IDocumentValidator
        {
            services.AddSingleton<IDocumentValidator, T>();
            return services;
        }

        /// <summary>
        /// Registers a document validator with a specified service lifetime.
        /// </summary>
        public IServiceCollection AddDocumentValidator<T>(ServiceLifetime lifetime)
            where T : class, IDocumentValidator
        {
            services.Add(new ServiceDescriptor(typeof(IDocumentValidator), typeof(T), lifetime));
            return services;
        }

        /// <summary>
        /// Registers a document validator as scoped
        /// </summary>
        public IServiceCollection AddScopedDocumentValidator<T>()
            where T : class, IDocumentValidator
        {
            services.AddScoped<IDocumentValidator, T>();
            return services;
        }

        /// <summary>
        /// Registers a document validator as transient
        /// </summary>
        public IServiceCollection AddTransientDocumentValidator<T>()
            where T : class, IDocumentValidator
        {
            services.AddTransient<IDocumentValidator, T>();
            return services;
        }
    }

    #endregion
}
