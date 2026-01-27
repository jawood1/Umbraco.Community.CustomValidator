using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Services;
using Umbraco.Community.CustomValidator.Models;
using Umbraco.Community.CustomValidator.Services;
using Umbraco.Extensions;

namespace Umbraco.Community.CustomValidator.Validation;

using Microsoft.Extensions.Options;
using Umbraco.Community.CustomValidator.Enums;
using Umbraco.Community.CustomValidator.Extensions;

/// <summary>
/// Executes document validation with caching, culture resolution, and variation context handling.
/// </summary>
public sealed class CustomValidationService(
    CustomValidatorRegistry validatorRegistry,
    CustomValidationCacheService validationCache,
    CustomValidationStatusCache statusCache,
    IOptions<CustomValidatorOptions> options,
    IVariationContextAccessor variationContextAccessor,
    ILanguageService languageService,
    ILogger<CustomValidationService> logger)
{
    /// <summary>
    /// Executes validation for a document with caching support.
    /// </summary>
    /// <param name="content">The document</param>
    /// <param name="culture">Optional culture code. Null for invariant content.</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Validation response</returns>
    public async Task<ValidationResponse> ExecuteValidationAsync(
        IPublishedContent content,
        string? culture,
        CancellationToken cancellationToken = default)
    {

        if (!validatorRegistry.HasValidator(content))
        {
            logger.LogDebug("No validator configured for document {DocumentId}, content type: {ContentType}",
                content.Key, content.ContentType.Alias);

            statusCache.SetStatus(content.Key, ValidationStatus.Unknown);

            return new ValidationResponse
            {
                ContentId = content.Key,
                HasValidator = false,
                Messages = []
            };
        }

        var response = await validationCache.GetOrSetAsync(
            content.Key, culture,
            async _ =>
            {
                var currentCulture = await GetCurrentCultureAsync(culture, content);

                if (!string.IsNullOrEmpty(currentCulture))
                {
                    variationContextAccessor.VariationContext = new VariationContext(currentCulture);
                    logger.LogDebug("Set variation context to culture: {Culture}", currentCulture);
                }

                var validationMessages = await validatorRegistry.ValidateAsync(content);
                var validationResponse = new ValidationResponse
                {
                    ContentId = content.Key,
                    HasValidator = true,
                    Messages = validationMessages
                };

                var hasErrors = validationResponse.HasValidationErrors(options.Value.TreatWarningsAsErrors);
                statusCache.SetStatus(content.Key, hasErrors);

                return validationResponse;

            }, cancellationToken);

        return response;
    }

    private async Task<string?> GetCurrentCultureAsync(string? culture, IPublishedContent content)
    {
        if (!string.IsNullOrWhiteSpace(culture))
        {
            return culture;
        }

        var domainCulture = content.GetCultureFromDomains();

        if (!string.IsNullOrEmpty(domainCulture))
        {
            return domainCulture;
        }

        return await languageService.GetDefaultIsoCodeAsync();
    }
}