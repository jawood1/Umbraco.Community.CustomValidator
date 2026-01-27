namespace Umbraco.Community.CustomValidator.Services;

using Microsoft.Extensions.Logging;
using Umbraco.Cms.Api.Management.Services.Flags;
using Umbraco.Cms.Api.Management.ViewModels;
using Umbraco.Cms.Api.Management.ViewModels.Document.Collection;
using Umbraco.Cms.Api.Management.ViewModels.Document.Item;
using Umbraco.Cms.Api.Management.ViewModels.Tree;
using Umbraco.Community.CustomValidator.Enums;

/// <summary>
/// Provides flags for documents that have validation errors.
/// </summary>
public sealed class CustomValidationErrorFlagProvider(
    CustomValidationStatusCache statusCache,
    ILogger<CustomValidationErrorFlagProvider> logger)
    : IFlagProvider
{
    private const string FlagAlias = "CustomValidator.ValidationErrorsFlag";

    /// <inheritdoc/>
    public bool CanProvideFlags<TItem>() where TItem : IHasFlags =>
        typeof(TItem) == typeof(DocumentTreeItemResponseModel) ||
        typeof(TItem) == typeof(DocumentCollectionResponseModel) ||
        typeof(TItem) == typeof(DocumentItemResponseModel);

    /// <inheritdoc/>
    public Task PopulateFlagsAsync<TItem>(IEnumerable<TItem> items) where TItem : IHasFlags
    {
        var itemsList = items.ToList();

        if (itemsList.Count == 0)
        {
            return Task.CompletedTask;
        }

        var documentKeys = itemsList
            .Select(item => item.Id)
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToArray();

        if (documentKeys.Length == 0)
        {
            logger.LogDebug("No valid document IDs to check for validation flags");
            return Task.CompletedTask;
        }

        var validationStatuses = GetDocsWithErrors(documentKeys);

        foreach (var item in itemsList.Where(item => validationStatuses.Contains(item.Id)))
        {
            item.AddFlag(FlagAlias);
        }

        return Task.CompletedTask;
    }

    private List<Guid> GetDocsWithErrors(Guid[] documentIds) => 
        documentIds.Where(id => statusCache.GetStatus(id) is ValidationStatus.HasErrors).ToList();
}