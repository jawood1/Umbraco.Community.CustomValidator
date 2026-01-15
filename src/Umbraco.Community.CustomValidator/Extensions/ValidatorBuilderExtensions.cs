using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Community.CustomValidator.Interfaces;

namespace Umbraco.Community.CustomValidator.Extensions
{
    public static class ValidatorBuilderExtensions
    {
        public static void AddDocumentValidator<T>(this IUmbracoBuilder builder)
            where T : class, IDocumentValidator
        {
            builder.Services.AddSingleton<IDocumentValidator, T>();
        }

        public static void AddDocumentValidator<T>(this IServiceCollection serviceCollection)
            where T : class, IDocumentValidator
        {
            serviceCollection.AddSingleton<IDocumentValidator, T>();
        }
    }
}
