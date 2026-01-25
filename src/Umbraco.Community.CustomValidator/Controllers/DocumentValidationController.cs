using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Web;
using Umbraco.Community.CustomValidator.Models;
using Umbraco.Community.CustomValidator.Services;
using Umbraco.Community.CustomValidator.Validation;
using Umbraco.Extensions;

namespace Umbraco.Community.CustomValidator.Controllers;

[VersionedApiBackOfficeRoute("validation")]
[ApiExplorerSettings(GroupName = "Document Validation API")]
public sealed class DocumentValidationController(
    DocumentValidationService validationService,
    ValidationCacheService cacheService,
    IUmbracoContextAccessor umbracoContextAccessor,
    IVariationContextAccessor variationContextAccessor,
    ILanguageService languageService,
    ILogger<DocumentValidationController> logger)
    : ManagementApiControllerBase
{

    [HttpGet("validate/{id:guid}")]
    public async Task<IActionResult> ValidateDocument(Guid id, [FromQuery] string? culture)
    {
        try
        {

            var response = await cacheService.GetOrSetAsync(
                id,
                culture,
                async _ =>
                {
                    var umbracoContext = umbracoContextAccessor.GetRequiredUmbracoContext();
                    var content = umbracoContext.Content.GetById(preview: true, id);

                    if (content == null || !validationService.HasValidator(content))
                    {
                        return new ValidationResponse
                        {
                            ContentId = id,
                            HasValidator = false,
                            Messages = []
                        };
                    }

                    return await ValidateDocument(id, culture, content);
                });
                
            return Ok(response);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unexpected error validating document {DocumentId}", id);

            return Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Validation Error",
                detail: "An exception occurred while validating the document. Please check the logs."
            );
        }
    }

    private async Task<ValidationResponse> ValidateDocument(Guid id, string? culture, IPublishedContent content)
    {
        var currentCulture = await GetCurrentCultureAsync(culture, content);

        if (!string.IsNullOrEmpty(currentCulture))
        {
            variationContextAccessor.VariationContext = new VariationContext(currentCulture);
        }

        var validationMessages = await validationService.ValidateAsync(content);

        return new ValidationResponse
        {
            ContentId = id,
            HasValidator = true,
            Messages = validationMessages
        };
    }

    private async Task<string?> GetCurrentCultureAsync(string? culture, IPublishedContent content)
    {
        var currentCulture = string.IsNullOrWhiteSpace(culture)
            ? content?.GetCultureFromDomains()
            : culture;

        if (string.IsNullOrEmpty(currentCulture))
        {
            currentCulture = await languageService.GetDefaultIsoCodeAsync();
        }

        return currentCulture;
    }
}
