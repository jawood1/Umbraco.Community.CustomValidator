# Umbraco Community Custom Validator

[![Downloads](https://img.shields.io/nuget/dt/Umbraco.Community.CustomValidator?color=cc9900)](https://www.nuget.org/packages/Umbraco.Community.CustomValidator/)
[![NuGet](https://img.shields.io/nuget/vpre/Umbraco.Community.CustomValidator?color=0273B3)](https://www.nuget.org/packages/Umbraco.Community.CustomValidator)
[![GitHub license](https://img.shields.io/github/license/YourGitHubUsername/YourGitHubRepoName?color=8AB803)](https://github.com/YourGitHubUsername/YourGitHubRepoName/blob/main/LICENSE)

A document type validation framework for Umbraco CMS v17+ that provides real-time content validation with a backoffice UI. Display validation results directly in the Umbraco backoffice with support for multi-culture content and automatic publish blocking when errors are present.

## Features

- ✅ Real-time validation in the Umbraco backoffice
- 🌍 Multi-culture support with split-view validation
- 🏷️ Inline field badges - validation messages appear next to the relevant property, not just in the tab
- 🔗 Related properties - a single message can flag more than one property
- 🚫 Automatic publish blocking when validation errors exist
- 📊 Three severity levels: Error, Warning, Info
- 🎨 Dedicated validation tab with color-coded messages
- ✍️ Fluent `AddError`/`AddWarning`/`AddInfo` message builder - no hand-typed alias strings
- 🔧 Easy to extend with custom validators

## Quick Start

### 1. Create a Validator

```csharp
using Umbraco.Cms.Web.Common.PublishedModels;
using Umbraco.Community.CustomValidator.Extensions;
using Umbraco.Community.CustomValidator.Models;
using Umbraco.Community.CustomValidator.Validation;

public class ArticleValidator : BaseDocumentValidator<Article>
{
    public override Task<IEnumerable<ValidationMessage>> ValidateAsync(Article content)
    {
        var messages = new List<ValidationMessage>();

        if (string.IsNullOrWhiteSpace(content.Title))
        {
            messages.AddError<Article>("Article title is required", x => x.Title);
        }

        if (!string.IsNullOrWhiteSpace(content.Excerpt) && content.Excerpt.Length > 200)
        {
            messages.AddWarning<Article>("Excerpt should not exceed 200 characters", x => x.Excerpt);
        }

        return Task.FromResult<IEnumerable<ValidationMessage>>(messages);
    }
}
```

`AddError`/`AddWarning`/`AddInfo` resolve the property alias from the expression for you, and show an inline badge next to that field in addition to the Validation tab entry.

### 2. Register Your Validator

```csharp
using Umbraco.Cms.Core.Composing;
using Umbraco.Community.CustomValidator.Extensions;

public class ValidationComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.AddDocumentValidator<ArticleValidator, Article>();
    }
}
```

### 3. View Validation Results

Navigate to any document in the Umbraco backoffice and open the **Validation** tab to see real-time validation results - or spot the inline badge next to the field itself.

## Validation Severity Levels

- **Error** - Blocks publishing (red)
- **Warning** - Allows publishing (orange)  
- **Info** - Informational only (blue)

## Documentation

Full documentation, examples, and advanced usage guides available at:
[GitHub Repository](https://github.com/jawood1/Umbraco.Community.CustomValidator)

## Requirements

- Umbraco CMS 17.0+
- .NET 10.0+

## Support

- [Report Issues](https://github.com/jawood1/Umbraco.Community.CustomValidator/issues)
- [Umbraco Discord](https://discord.umbraco.com/)
- [Umbraco Forum](https://forum.umbraco.com/)

## License

MIT License - Built for the Umbraco Community