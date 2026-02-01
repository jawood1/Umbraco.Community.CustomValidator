using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Community.CustomValidator.Interfaces;
using Umbraco.Community.CustomValidator.Models;

namespace Umbraco.Community.CustomValidator.Extensions;

public static class ValidatorBuilderExtensions
{
    extension(IUmbracoBuilder builder)
    {
        /// <summary>
        /// Registers a document validator as a singleton with explicit content type.
        /// </summary>
        public IUmbracoBuilder AddDocumentValidator<TValidator, TContent>()
            where TValidator : class, IDocumentValidator<TContent>, IDocumentValidator
            where TContent : class, IPublishedContent
        {
            builder.Services.AddDocumentValidator<TValidator, TContent>();

            return builder;
        }

        /// <summary>
        /// Registers a document validator with specified lifetime and explicit content type.
        /// </summary>
        public IUmbracoBuilder AddDocumentValidator<TValidator, TContent>(ServiceLifetime lifetime)
            where TValidator : class, IDocumentValidator<TContent>, IDocumentValidator
            where TContent : class, IPublishedContent
        {
            builder.Services.AddDocumentValidator<TValidator, TContent>(lifetime);
            return builder;
        }

        /// <summary>
        /// Registers a document validator as scoped with explicit content type.
        /// </summary>
        public IUmbracoBuilder AddScopedDocumentValidator<TValidator, TContent>()
            where TValidator : class, IDocumentValidator<TContent>, IDocumentValidator
            where TContent : class, IPublishedContent
        {
            builder.Services.AddScopedDocumentValidator<TValidator, TContent>();
            return builder;
        }

        /// <summary>
        /// Registers a document validator as transient with explicit content type.
        /// </summary>
        public IUmbracoBuilder AddTransientDocumentValidator<TValidator, TContent>()
            where TValidator : class, IDocumentValidator<TContent>, IDocumentValidator
            where TContent : class, IPublishedContent
        {
            builder.Services.AddTransientDocumentValidator<TValidator, TContent>();
            return builder;
        }
    }

    // IServiceCollection overloads
    extension(IServiceCollection services)
    {
        /// <summary>
        /// Registers a document validator as a singleton with explicit content type.
        /// </summary>
        public IServiceCollection AddDocumentValidator<TValidator, TContent>()
            where TValidator : class, IDocumentValidator<TContent>, IDocumentValidator
            where TContent : class, IPublishedContent
        {
            services.AddSingleton<TValidator>();
            services.AddSingleton<IDocumentValidator>(sp => sp.GetRequiredService<TValidator>());
            services.AddMetaData<TValidator, TContent>();

            return services;
        }

        /// <summary>
        /// Registers a document validator with specified lifetime and explicit content type.
        /// </summary>
        public IServiceCollection AddDocumentValidator<TValidator, TContent>(ServiceLifetime lifetime)
            where TValidator : class, IDocumentValidator<TContent>, IDocumentValidator
            where TContent : class, IPublishedContent
        {
            services.Add(new ServiceDescriptor(typeof(TValidator), typeof(TValidator), lifetime));
            services.Add(new ServiceDescriptor(typeof(IDocumentValidator), sp => sp.GetRequiredService<TValidator>(), lifetime));
            services.AddMetaData<TValidator, TContent>();

            return services;
        }

        /// <summary>
        /// Registers a document validator as scoped with explicit content type.
        /// </summary>
        public IServiceCollection AddScopedDocumentValidator<TValidator, TContent>()
            where TValidator : class, IDocumentValidator<TContent>, IDocumentValidator
            where TContent : class, IPublishedContent
        {
            services.AddScoped<TValidator>();
            services.AddScoped<IDocumentValidator>(sp => sp.GetRequiredService<TValidator>());
            services.AddMetaData<TValidator, TContent>();

            return services;
        }

        /// <summary>
        /// Registers a document validator as transient with explicit content type.
        /// </summary>
        public IServiceCollection AddTransientDocumentValidator<TValidator, TContent>()
            where TValidator : class, IDocumentValidator<TContent>, IDocumentValidator
            where TContent : class, IPublishedContent
        {
            services.AddTransient<TValidator>();
            services.AddTransient<IDocumentValidator>(sp => sp.GetRequiredService<TValidator>());
            services.AddMetaData<TValidator, TContent>();

            return services;
        }

        private void AddMetaData<TValidator, TContent>()
            where TValidator : class, IDocumentValidator<TContent>, IDocumentValidator
            where TContent : class, IPublishedContent
        {
            services.AddSingleton(new ValidatorMetadata
            {
                ValidatorType = typeof(TValidator),
                NameOfType = typeof(TContent).Name
            });
        }
    }
}
