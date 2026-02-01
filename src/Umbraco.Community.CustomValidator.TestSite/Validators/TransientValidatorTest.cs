namespace Umbraco.Community.CustomValidator.TestSite.Validators;

using Umbraco.Cms.Web.Common.PublishedModels;
using Umbraco.Community.CustomValidator.Enums;
using Umbraco.Community.CustomValidator.Models;
using Umbraco.Community.CustomValidator.Validation;

public class TransientValidatorTest : BaseDocumentValidator<Article>
{
    private readonly Guid _instanceId = Guid.NewGuid();
    private readonly ILogger<TransientValidatorTest> _logger;

    public TransientValidatorTest(ILogger<TransientValidatorTest> logger)
    {
        _logger = logger;
        _logger.LogInformation("TransientTestValidator created with instance ID: {InstanceId}", _instanceId);
    }

    public override Task<IEnumerable<ValidationMessage>> ValidateAsync(Article content)
    {
        _logger.LogInformation("Validation running on instance: {InstanceId}", _instanceId);

        return Task.FromResult<IEnumerable<ValidationMessage>>(new List<ValidationMessage>
        {
            new()
            {
                Message = $"Validated by instance {_instanceId}",
                Severity = ValidationSeverity.Info
            }
        });
    }
}
