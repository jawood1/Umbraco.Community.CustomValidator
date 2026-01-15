using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Community.CustomValidator.Interfaces;

namespace Umbraco.Community.CustomValidator.Extensions
{
    public static class ValidatorBuilderExtensions
    {
        public static void AddValidator<T>(this IUmbracoBuilder builder)
            where T : class, IDocumentValidator
        {
            builder.Services.AddSingleton<IDocumentValidator, T>();
        }

        public static void AddValidator<T>(this IServiceCollection serviceCollection)
            where T : class, IDocumentValidator
        {
            serviceCollection.AddSingleton<IDocumentValidator, T>();
        }
    }
}
