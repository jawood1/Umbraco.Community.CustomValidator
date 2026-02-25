using Microsoft.Extensions.Logging;
using Umbraco.Cms.Api.Management.Services.Flags;
using Umbraco.Cms.Api.Management.ViewModels;
using Umbraco.Cms.Api.Management.ViewModels.Document;
using Umbraco.Cms.Api.Management.ViewModels.Document.Collection;
using Umbraco.Cms.Api.Management.ViewModels.Document.Item;
using Umbraco.Cms.Api.Management.ViewModels.Tree;

namespace Umbraco.Community.CustomValidator.Services;

/// <summary>
/// Provides flags for documents that have validation errors.
/// </summary>
public sealed class CustomValidationErrorFlagProvider(
    CustomValidationFlagStatusResolver flagStatusResolver,
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
    public async Task PopulateFlagsAsync<TItem>(IEnumerable<TItem> items) where TItem : IHasFlags
    {
        var itemsList = items.ToList();

        if (itemsList.Count == 0)
        {
            return;
        }

        var documentKeys = itemsList
            .Select(item => item.Id)
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToArray();

        if (documentKeys.Length == 0)
        {
            logger.LogDebug("No valid document IDs to check for validation flags");
            return;
        }

        foreach (var item in itemsList)
        {
            switch (item)
            {
                case DocumentTreeItemResponseModel documentTreeItem:
                    documentTreeItem.Variants = await PopulateVariantsAsync(documentTreeItem.Id, documentTreeItem.Variants);
                    break;

                case DocumentCollectionResponseModel documentCollectionItem:
                    documentCollectionItem.Variants = await PopulateVariantsAsync(documentCollectionItem.Id, documentCollectionItem.Variants);
                    break;

                case DocumentItemResponseModel documentItem:
                    documentItem.Variants = await PopulateVariantsAsync(documentItem.Id, documentItem.Variants);
                    break;
            }
        }
    }

    private async Task<IEnumerable<DocumentVariantItemResponseModel>> PopulateVariantsAsync(
        Guid documentId,
        IEnumerable<DocumentVariantItemResponseModel> variants)
    {
        var variantsArray = variants.ToArray();

        if (variantsArray.Length == 0)
        {
            return variantsArray;
        }

        foreach (var variant in variantsArray)
        {
            if (await flagStatusResolver.HasErrorsAsync(documentId, variant.Culture))
            {
                variant.AddFlag(FlagAlias);
            }
        }

        return variantsArray;
    }

    private async Task<IEnumerable<DocumentVariantResponseModel>> PopulateVariantsAsync(
        Guid documentId,
        IEnumerable<DocumentVariantResponseModel> variants)
    {
        var variantsArray = variants.ToArray();

        if (variantsArray.Length == 0)
        {
            return variantsArray;
        }

        foreach (var variant in variantsArray)
        {
            if (await flagStatusResolver.HasErrorsAsync(documentId, variant.Culture))
            {
                variant.AddFlag(FlagAlias);
            }
        }

        return variantsArray;
    }
}