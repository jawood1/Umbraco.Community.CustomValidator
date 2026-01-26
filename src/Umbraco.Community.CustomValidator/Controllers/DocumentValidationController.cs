using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using Umbraco.Cms.Core.Web;
using Umbraco.Community.CustomValidator.Models;
using Umbraco.Community.CustomValidator.Validation;
using Umbraco.Extensions;

namespace Umbraco.Community.CustomValidator.Controllers;

[VersionedApiBackOfficeRoute("validation")]
[ApiExplorerSettings(GroupName = "Document Validation API")]
public sealed class DocumentValidationController(
    IUmbracoContextAccessor umbracoContextAccessor,
    ValidationExecutor validationExecutor,
    ILogger<DocumentValidationController> logger)
    : ManagementApiControllerBase
{

    [HttpGet("validate/{id:guid}")]
    [ProducesResponseType(typeof(ValidationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ValidateDocument(Guid id, [FromQuery] string? culture)
    {
        try
        {
            var umbracoContext = umbracoContextAccessor.GetRequiredUmbracoContext();
            var content = umbracoContext.Content.GetById(preview: true, id);

            if (content == null)
            {
                return Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Validation Error",
                    detail: "The document could not be found. If new ensure it is saved first."
                );
            }

            var response = await validationExecutor.ExecuteValidationAsync(content, culture);

            return Ok(response);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Custom Validator: Unexpected error validating document {DocumentId}", id);

            return Problem(
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Validation Error",
                detail: "An exception occurred while validating the document. Please check the logs."
            );
        }
    }
}
