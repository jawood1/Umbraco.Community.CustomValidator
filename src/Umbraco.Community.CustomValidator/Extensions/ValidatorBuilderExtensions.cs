using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Community.CustomValidator.Interfaces;

namespace Umbraco.Community.CustomValidator.Extensions;

public static class ValidatorBuilderExtensions
{
    extension(IUmbracoBuilder builder)
    {
        public IUmbracoBuilder AddDocumentValidator<T>()
            where T : class, IDocumentValidator
        {
            builder.Services.AddSingleton<T>();
            builder.Services.AddSingleton<IDocumentValidator>(sp => sp.GetRequiredService<T>());
            return builder;
        }

        public IUmbracoBuilder AddDocumentValidator<T>(ServiceLifetime lifetime)
            where T : class, IDocumentValidator
        {
            builder.Services.Add(new ServiceDescriptor(typeof(T), typeof(T), lifetime));
            builder.Services.Add(new ServiceDescriptor(typeof(IDocumentValidator), sp => sp.GetRequiredService<T>(), lifetime));
            return builder;
        }

        public IUmbracoBuilder AddScopedDocumentValidator<T>()
            where T : class, IDocumentValidator
        {
            builder.Services.AddScoped<T>();
            builder.Services.AddScoped<IDocumentValidator>(sp => sp.GetRequiredService<T>());
            return builder;
        }

        public IUmbracoBuilder AddTransientDocumentValidator<T>()
            where T : class, IDocumentValidator
        {
            builder.Services.AddTransient<T>();
            builder.Services.AddTransient<IDocumentValidator>(sp => sp.GetRequiredService<T>());
            return builder;
        }
    }

    // IServiceCollection overloads
    extension(IServiceCollection services)
    {
        public IServiceCollection AddDocumentValidator<T>()
            where T : class, IDocumentValidator
        {
            services.AddSingleton<T>();
            services.AddSingleton<IDocumentValidator>(sp => sp.GetRequiredService<T>());
            return services;
        }

        public IServiceCollection AddDocumentValidator<T>(ServiceLifetime lifetime)
            where T : class, IDocumentValidator
        {
            services.Add(new ServiceDescriptor(typeof(T), typeof(T), lifetime));
            services.Add(new ServiceDescriptor(typeof(IDocumentValidator), sp => sp.GetRequiredService<T>(), lifetime));
            return services;
        }

        public IServiceCollection AddScopedDocumentValidator<T>()
            where T : class, IDocumentValidator
        {
            services.AddScoped<T>();
            services.AddScoped<IDocumentValidator>(sp => sp.GetRequiredService<T>());
            return services;
        }

        public IServiceCollection AddTransientDocumentValidator<T>()
            where T : class, IDocumentValidator
        {
            services.AddTransient<T>();
            services.AddTransient<IDocumentValidator>(sp => sp.GetRequiredService<T>());
            return services;
        }
    }
}
