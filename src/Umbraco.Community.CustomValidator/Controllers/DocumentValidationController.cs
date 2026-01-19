using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Web;
using Umbraco.Community.CustomValidator.Enums;
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

    private const string DefaultCultureKey = "default";

    [HttpPost("validate/{id:guid}")]
    public async Task<IActionResult> ValidateDocument(Guid id, [FromBody] DocumentValidationRequest request)
    {
        var result = new Dictionary<string, ValidationResponse>();

        try
        {
            var umbracoContext = umbracoContextAccessor.GetRequiredUmbracoContext();
            var content = umbracoContext.Content.GetById(preview: true, id);

            if (content == null || !validationService.HasValidator(content))
            {
                result[DefaultCultureKey] = new ValidationResponse
                {
                    ContentId = id,
                    HasValidator = false,
                    Messages = []
                };

                return Ok(result);
            }

            var cultures = request.Cultures is { Count: > 0 }
                ? request.Cultures
                    .Select(c => string.IsNullOrEmpty(c) || c == "undefined" ? DefaultCultureKey : c)
                    .Distinct()
                    .ToList()
                : [DefaultCultureKey];

            foreach (var culture in cultures)
            {
                try
                {
                    var currentCulture = await GetCurrentCultureAsync(culture, content);

                    if (!string.IsNullOrEmpty(currentCulture))
                    {
                        variationContextAccessor.VariationContext = new VariationContext(currentCulture);
                    }

                    var validationMessages = await validationService.ValidateAsync(content);

                    result.TryAdd(culture, new ValidationResponse
                    {
                        ContentId = id,
                        HasValidator = true,
                        Messages = validationMessages
                    });
                }
                catch (Exception exCulture)
                {
                    logger.LogError(exCulture, "Error validating document {DocumentId} with culture {Culture}", id, culture);

                    result.TryAdd(culture, new ValidationResponse
                    {
                        ContentId = id,
                        HasValidator = true,
                        Messages = [
                            new ValidationMessage {
                                Message = $"An unexpected error occurred during validation. Please check the logs.", 
                                Severity = ValidationSeverity.Error
                            }]
                    });
                }
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error validating document {DocumentId}", id);

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
