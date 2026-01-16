using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Web;
using Umbraco.Community.CustomValidator.Models;
using Umbraco.Community.CustomValidator.Validation;
using Umbraco.Extensions;

namespace Umbraco.Community.CustomValidator.Controllers;

[VersionedApiBackOfficeRoute("validation")]
[ApiExplorerSettings(GroupName = "Document Validation API")]
public sealed class DocumentValidationController(
    DocumentValidationService validationService,
    IUmbracoContextAccessor umbracoContextAccessor,
    IVariationContextAccessor variationContextAccessor,
    ILanguageService languageService,
    ILogger<DocumentValidationController> logger)
    : ManagementApiControllerBase
{
    [HttpGet("validate/{id:guid}")]
    public async Task<IActionResult> ValidateDocument(Guid id, [FromQuery] string? culture = null)
    {
        try
        {
            var umbracoContext = umbracoContextAccessor.GetRequiredUmbracoContext();
            var content = umbracoContext.Content.GetById(preview: true, id);

            if (content == null)
            {
                return Ok(new ValidationResponse
                {
                    ContentId = id,
                    ContentTypeAlias = string.Empty,
                    HasValidator = false,
                    Messages = []
                });
            }

            // Set the culture context for validation
            var currentCulture = await GetCurrentCultureAsync(culture, content);
            if (!string.IsNullOrEmpty(currentCulture))
            {
                variationContextAccessor.VariationContext = new VariationContext(currentCulture);
            }

            var validationMessages = await validationService.ValidateAsync(content);

            return Ok(new ValidationResponse
            {
                ContentId = id,
                ContentTypeAlias = content.ContentType.Alias,
                HasValidator = validationService.HasValidator(content.ContentType.Alias),
                Messages = validationMessages
            });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error validating document {DocumentId} with culture {Culture}", id, culture);
            
            return Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Validation Error",
                detail: "An exception occurred while validating the document. Please check the logs."
            );
        }
    }

    private async Task<string?> GetCurrentCultureAsync(string? culture, IPublishedContent? content = null)
    {
        var currentCulture = string.IsNullOrWhiteSpace(culture)
            ? content?.GetCultureFromDomains()
            : culture;

        if (string.IsNullOrEmpty(currentCulture) || culture == "undefined")
        {
            currentCulture = await languageService.GetDefaultIsoCodeAsync();
        }

        return currentCulture;
    }
}
