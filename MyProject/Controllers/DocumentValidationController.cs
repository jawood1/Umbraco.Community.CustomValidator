using Microsoft.AspNetCore.Mvc;
using MyProject.Validation;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core.Web;

namespace MyProject.Controllers;

[VersionedApiBackOfficeRoute("validation")]
[ApiExplorerSettings(GroupName = "Document Validation API")]
public class DocumentValidationController : ManagementApiControllerBase
{
    private readonly DocumentValidationService _validationService;
    private readonly IUmbracoContextAccessor _umbracoContextAccessor;

    public DocumentValidationController(
        DocumentValidationService validationService,
        IUmbracoContextAccessor umbracoContextAccessor)
    {
        _validationService = validationService;
        _umbracoContextAccessor = umbracoContextAccessor;
    }

    [HttpGet("validate/{id:guid}")]
    public async Task<IActionResult> ValidateDocument(Guid id)
    {
        var umbracoContext = _umbracoContextAccessor.GetRequiredUmbracoContext();
        var content = umbracoContext.Content?.GetById(preview: true, id);

        if (content == null)
        {
            return NotFound(new { message = "Document not found" });
        }

        var validationMessages = await _validationService.ValidateAsync(content);

        return Ok(new
        {
            contentId = id,
            contentTypeAlias = content.ContentType.Alias,
            hasValidator = _validationService.HasValidator(content.ContentType.Alias),
            messages = validationMessages.Select(m => new
            {
                message = m.Message,
                severity = m.Severity.ToString(),
                propertyAlias = m.PropertyAlias
            })
        });
    }
}
