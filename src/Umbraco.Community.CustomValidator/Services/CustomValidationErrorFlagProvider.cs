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
/// Retrieves validation status for all items in a single batch operation for optimal performance.
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

        // Extract all document GUIDs from items in one go
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

            switch (item)
            {
                case DocumentTreeItemResponseModel treeItem:
                    AddFlagToTreeItem(treeItem);
                    break;

                case DocumentCollectionResponseModel collectionItem:
                    AddFlagToCollectionItem(collectionItem);
                    break;

                case DocumentItemResponseModel documentItem:
                    AddFlagToDocumentItem(documentItem);
                    break;
            }
        }

        return Task.CompletedTask;
    }

    private List<Guid> GetDocsWithErrors(Guid[] documentIds) => 
        documentIds.Where(id => statusCache.GetStatus(id) is ValidationStatus.HasErrors).ToList();

    /// <summary>
    /// Adds validation error flag to a tree item.
    /// </summary>
    private void AddFlagToTreeItem(DocumentTreeItemResponseModel item)
    {
        foreach (var variant in item.Variants)
        {
            variant.AddFlag(FlagAlias);
        }
    }

    /// <summary>
    /// Adds validation error flag to a collection item.
    /// </summary>
    private void AddFlagToCollectionItem(DocumentCollectionResponseModel item)
    {
        foreach (var variant in item.Variants)
        {
            variant.AddFlag(FlagAlias);
        }
    }

    /// <summary>
    /// Adds validation error flag to a document item.
    /// </summary>
    private void AddFlagToDocumentItem(DocumentItemResponseModel item)
    {
        foreach (var variant in item.Variants)
        {
            variant.AddFlag(FlagAlias);
        }
    }
}