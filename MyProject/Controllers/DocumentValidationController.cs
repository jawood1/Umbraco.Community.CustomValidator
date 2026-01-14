using Microsoft.AspNetCore.Mvc;
using MyProject.Validation;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Web;
using Umbraco.Extensions;

namespace MyProject.Controllers;

[VersionedApiBackOfficeRoute("validation")]
[ApiExplorerSettings(GroupName = "Document Validation API")]
public class DocumentValidationController : ManagementApiControllerBase
{
    private readonly DocumentValidationService _validationService;
    private readonly IUmbracoContextAccessor _umbracoContextAccessor;
    private readonly IVariationContextAccessor _variationContextAccessor;
    private readonly ILanguageService _languageService;

    public DocumentValidationController(
        DocumentValidationService validationService,
        IUmbracoContextAccessor umbracoContextAccessor,
        IVariationContextAccessor variationContextAccessor,
        ILanguageService languageService)
    {
        _validationService = validationService;
        _umbracoContextAccessor = umbracoContextAccessor;
        _variationContextAccessor = variationContextAccessor;
        _languageService = languageService;
    }

    [HttpGet("validate/{id:guid}")]
    public async Task<IActionResult> ValidateDocument(Guid id, [FromQuery] string? culture = null)
    {
        var umbracoContext = _umbracoContextAccessor.GetRequiredUmbracoContext();
        var content = umbracoContext.Content?.GetById(preview: true, id);

        if (content == null)
        {
            return NotFound(new { message = "Document not found" });
        }

        // Set the culture context for validation
        var currentCulture = await GetCurrentCultureAsync(culture, content);
        if (!string.IsNullOrEmpty(currentCulture))
        {
            _variationContextAccessor.VariationContext = new VariationContext(currentCulture);
        }

        var validationMessages = await _validationService.ValidateAsync(content);

        return Ok(new
        {
            contentId = id,
            contentTypeAlias = content.ContentType.Alias,
            culture = currentCulture,
            hasValidator = _validationService.HasValidator(content.ContentType.Alias),
            messages = validationMessages.Select(m => new
            {
                message = m.Message,
                severity = m.Severity.ToString()
            })
        });
    }

    private async Task<string?> GetCurrentCultureAsync(string? culture, IPublishedContent? content = null)
    {
        var currentCulture = string.IsNullOrWhiteSpace(culture)
            ? content?.GetCultureFromDomains()
            : culture;

        if (string.IsNullOrEmpty(currentCulture) || culture == "undefined")
        {
            currentCulture = await _languageService.GetDefaultIsoCodeAsync();
        }

        return currentCulture;
    }
}
