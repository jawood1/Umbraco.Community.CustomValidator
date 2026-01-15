# Umbraco Community Custom Validator

[![Downloads](https://img.shields.io/nuget/dt/Umbraco.Community.CustomValidator?color=cc9900)](https://www.nuget.org/packages/Umbraco.Community.CustomValidator/)
[![NuGet](https://img.shields.io/nuget/vpre/Umbraco.Community.CustomValidator?color=0273B3)](https://www.nuget.org/packages/Umbraco.Community.CustomValidator)
[![GitHub license](https://img.shields.io/github/license/jawood1/Umbraco.Community.CustomValidator?color=8AB803)](../LICENSE)

A comprehensive document validation framework for Umbraco CMS that provides real-time content validation with a beautiful backoffice UI. Display validation results directly in the Umbraco backoffice with support for multi-culture content, severity levels (Error, Warning, Info), and automatic publish blocking when errors are present.

## Features

- ✅ **Real-time Validation** - Validate documents as editors work in the backoffice
- 🌍 **Multi-Culture Support** - Validate content for specific cultures in split-view mode
- 🚫 **Publish Prevention** - Automatically blocks publishing when validation errors exist
- 📊 **Severity Levels** - Categorize validation messages as Error, Warning, or Info
- 🎨 **Beautiful UI** - Dedicated validation tab in the content workspace with color-coded messages
- 🔧 **Easy to Extend** - Simple base class for creating custom validators
- 📝 **Type-Safe** - Built with strongly-typed models and enums

## Installation

Install the package via NuGet:

```bash
dotnet add package Umbraco.Community.CustomValidator
```

Or via the NuGet Package Manager:

```
Install-Package Umbraco.Community.CustomValidator
```

### Requirements

- Umbraco CMS 17.0+
- .NET 10.0+

## Quick Start

### 1. Create a Validator

Create a validator by inheriting from `BaseDocumentValidator<T>`:

```csharp
using Umbraco.Cms.Web.Common.PublishedModels;
using Umbraco.Community.CustomValidator.Enums;
using Umbraco.Community.CustomValidator.Models;
using Umbraco.Community.CustomValidator.Validation;

public class ArticleValidator : BaseDocumentValidator<Article>
{
    public ArticleValidator() : base(Article.ModelTypeAlias) { }

    public override Task<IEnumerable<ValidationMessage>> ValidateAsync(Article content)
    {
        var messages = new List<ValidationMessage>();

        // Validate title
        if (string.IsNullOrWhiteSpace(content.Title))
        {
            messages.Add(new ValidationMessage(
                Message: "Article title is required",
                Severity: ValidationSeverity.Error
            ));
        }

        // Validate excerpt length
        if (!string.IsNullOrWhiteSpace(content.Excerpt) && content.Excerpt.Length > 200)
        {
            messages.Add(new ValidationMessage(
                Message: "Excerpt should not exceed 200 characters",
                Severity: ValidationSeverity.Warning
            ));
        }

        // Informational message
        if (content.Tags?.Any() == true)
        {
            messages.Add(new ValidationMessage(
                Message: $"Article has {content.Tags.Count()} tags",
                Severity: ValidationSeverity.Info
            ));
        }

        return Task.FromResult<IEnumerable<ValidationMessage>>(messages);
    }
}
```

### 2. Register Your Validator

Create a composer to register your validator:

```csharp
using Umbraco.Cms.Core.Composing;
using Umbraco.Community.CustomValidator.Extensions;

public class ValidationComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.AddValidator<ArticleValidator>();
    }
}
```

### 3. Use the Validation Tab

Navigate to any document in the Umbraco backoffice. You'll see a new "Validation" tab in the content workspace. The tab displays:

- ✅ Success message when all validations pass
- ❌ Validation errors (blocks publishing)
- ⚠️ Validation warnings
- ℹ️ Informational messages

## Validation Severity Levels

The package supports three severity levels:

| Severity | Behavior | Color |
|----------|----------|-------|
| `ValidationSeverity.Error` | Blocks publishing | Red (Danger) |
| `ValidationSeverity.Warning` | Allows publishing | Orange (Warning) |
| `ValidationSeverity.Info` | Informational only | Blue (Default) |

## Advanced Usage

### Accessing Umbraco Services

Inject services into your validator constructor:

```csharp
public class ArticleValidator : BaseDocumentValidator<Article>
{
    private readonly IMediaService _mediaService;
    private readonly IContentService _contentService;

    public ArticleValidator(
        IMediaService mediaService,
        IContentService contentService) : base(Article.ModelTypeAlias)
    {
        _mediaService = mediaService;
        _contentService = contentService;
    }

    public override async Task<IEnumerable<ValidationMessage>> ValidateAsync(Article content)
    {
        // Use services for complex validation logic
        // ...
    }
}
```

### Multi-Culture Validation

The validation framework automatically handles culture-specific validation when content has multiple cultures enabled. The validation tab in split-view mode shows results for each culture independently.

### Blocking Publishing

When validation errors (`ValidationSeverity.Error`) are present, a notification handler automatically blocks the content from being published, ensuring data quality and consistency.

## API

### BaseDocumentValidator<T>

Abstract base class for all validators.

**Properties:**
- `ContentTypeAlias` (string) - The content type alias this validator handles

**Methods:**
- `ValidateAsync(T content)` - Override this method to implement validation logic

### ValidationMessage

Record type representing a single validation message.

**Properties:**
- `Message` (string) - The validation message text
- `Severity` (ValidationSeverity) - The severity level (Error, Warning, Info)

### ValidationSeverity (Enum)

```csharp
public enum ValidationSeverity
{
    Info,
    Warning,
    Error
}
```

## Architecture

The package consists of:

- **Backend (C#)**: Validation service, base validator class, API controller
- **Frontend (TypeScript/Lit)**: Custom workspace view tab, context management, UI components
- **Integration**: Notification handlers for publish prevention

## Contributing

Contributions are welcome! Please read the [Contributing Guidelines](CONTRIBUTING.md).

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## Support

- [Report Issues](https://github.com/jawood1/Umbraco.Community.CustomValidator/issues)
- [Umbraco Discord](https://discord.umbraco.com/)
- [Umbraco Forum](https://forum.umbraco.com/)

## Acknowledgments

Built for the Umbraco community with ❤️