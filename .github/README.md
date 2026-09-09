# Umbraco Community Custom Validator

[![Downloads](https://img.shields.io/nuget/dt/Umbraco.Community.CustomValidator?color=cc9900)](https://www.nuget.org/packages/Umbraco.Community.CustomValidator/)
[![NuGet](https://img.shields.io/nuget/vpre/Umbraco.Community.CustomValidator?color=0273B3)](https://www.nuget.org/packages/Umbraco.Community.CustomValidator)
[![GitHub license](https://img.shields.io/github/license/jawood1/Umbraco.Community.CustomValidator?color=8AB803)](../LICENSE)

Custom Validator is a validation framework for Umbraco backoffice that provides real-time content validation for complex business logic. Custom Validator displays validation results directly in the Umbraco backoffice with support for multi-culture content, severity levels (Error, Warning, Info), and automatic publish blocking when errors are present.

## Features

- ✅ **Real-time Validation** - Validate documents as editors work in the backoffice
- 🌍 **Multi-Culture Support** - Validate content for specific cultures in split-view mode
- 🏷️ **Inline Field Badges** - Validation messages appear directly next to the relevant property, not just in the tab
- 🔗 **Related Properties** - A single message can flag more than one property (e.g. cross-field rules)
- 🚫 **Publish Prevention** - Automatically blocks publishing when validation errors exist
- 📊 **Severity Levels** - Categorize validation messages as Error, Warning, or Info
- 🎨 **Validation Tab** - Dedicated validation tab in the content workspace with color-coded messages
- 🚩 **Tree Flags** - Configurable flag icons on the content tree to surface validation errors at a glance
- 🔧**Easy to Extend** - Simple base class for creating custom validators
- ✍️ **Fluent Message Builder** - Strongly-typed `AddError`/`AddWarning`/`AddInfo` helpers, no hand-typed alias strings
- 📝 **Type-Safe** - Built with strongly-typed models and enums

## Screenshots

### Validation Tab
![Validation tab showing error, warning, and info messages in the Umbraco backoffice](https://raw.githubusercontent.com/jawood1/Umbraco.Community.CustomValidator/main/docs/single-lang-view.jpg)

### Multi-Culture Split View
![Multi-culture validation results displayed in split-view mode](https://raw.githubusercontent.com/jawood1/Umbraco.Community.CustomValidator/main/docs/split-lang-view.jpg)

### Content Workspace Validation Errors
![Multi-culture validation results displayed in split-view mode](https://raw.githubusercontent.com/jawood1/Umbraco.Community.CustomValidator/main/docs/content-workspace-errors.jpg)

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

- Umbraco CMS 17.3+
- .NET 10.0+

## Quick Start

> **Important:** you must use generated strongly typed models in order to use CustomValidator. `Umbraco:Cms:ModelsBuilder:ModelsMode` **must** be set to either `SourceCodeAuto` or `SourceCodeManual` in your development environment and generated files committed to disk before deploying.
> 
> ```json
> "Umbraco": {
>  "CMS": {
>    "ModelsBuilder": {
>      "ModelsMode": "SourceCodeAuto"
>    }
>  }
>}
>```

### 1. Create a Validator

Create a validator by inheriting from `BaseDocumentValidator<T>`. Use the fluent `AddError`/`AddWarning`/`AddInfo` helpers to build up messages — they resolve the property alias for you from a strongly-typed expression, so there's no need to hand-type alias strings:

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

        // Validate title - shows an inline badge next to the Title field, as well as
        // in the Validation tab
        if (string.IsNullOrWhiteSpace(content.Title))
        {
            messages.AddError<Article>("Article title is required", x => x.Title);
        }

        // Validate excerpt length
        if (!string.IsNullOrWhiteSpace(content.Excerpt) && content.Excerpt.Length > 200)
        {
            messages.AddWarning<Article>("Excerpt should not exceed 200 characters", x => x.Excerpt);
        }

        // Informational message - document-level, no property alias, no inline badge
        if (content.Tags?.Any() == true)
        {
            messages.AddInfo($"Article has {content.Tags.Count()} tags");
        }

        return Task.FromResult<IEnumerable<ValidationMessage>>(messages);
    }
}
```

> Prefer building `ValidationMessage` directly? That still works — see [Building Messages Without the Fluent Helpers](#building-messages-without-the-fluent-helpers).

### 2. Register Your Validator

Create a composer to register your validator:

#### Singleton (Default - Best for Most Validators)
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

#### Scoped (For Database or Umbraco Service Dependencies)
```csharp
public class ValidationComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        // Use scoped when validator needs IContentService, DbContext, etc.
        builder.AddScopedDocumentValidator<ProductValidator. Product>();
    }
}
```

#### Direct Service Collection Registration
```csharp
// Singleton
builder.Services.AddDocumentValidator<ArticleValidator, Article>();

// Scoped
builder.Services.AddScopedDocumentValidator<ProductValidator, Product>();
```

**When to use each:**
- **Singleton**: Stateless validators (no dependencies or only logger) - *Default, best performance*
- **Scoped**: Validators needing `IContentService`, `DbContext`, or other per-request services
- **Transient**: Rarely needed, use `AddTransientDocumentValidator<T>()` if required

### 3. Use the Validation Tab and Inline Field Badges

Navigate to any document in the Umbraco backoffice. You'll see a new "Validation" tab in the content workspace. The tab displays:

- ✅ Success message when all validations pass
- ❌ Validation errors (blocks publishing)
- ⚠️ Validation warnings
- ℹ️ Informational messages

Any message tied to a property (via `AddError<T>`/`AddWarning<T>`/`AddInfo<T>`, or a manually-set `PropertyAlias`) also shows a coloured badge directly next to that property's label in the content workspace — editors don't need to open the Validation tab to spot which field needs attention.

## Validation Severity Levels

The package supports three severity levels:

| Severity | Behavior | Color |
|----------|----------|-------|
| `ValidationSeverity.Error` | Blocks publishing | Red (Danger) |
| `ValidationSeverity.Warning` | Allows publishing | Orange (Warning) |
| `ValidationSeverity.Info` | Informational only | Blue (Default) |

## Inline Field Validation Badges

Setting a property alias on a message (via the fluent helpers, or `PropertyAlias` directly) shows a badge next to that field's label — not just in the Validation tab. The badge shares the same message text and severity colour, and clears automatically the moment the editor changes that field's value (no need to re-run validation manually to see it disappear).

```csharp
// Fluent helper - resolves the alias for you from the property expression
messages.AddError<Article>("Article title is required", x => x.Title);
```

```csharp
// Equivalent, built manually
messages.Add(new ValidationMessage
{
    Message = "Article title is required",
    Severity = ValidationSeverity.Error,
    PropertyAlias = "title"
});
```

Messages with no property alias (e.g. `AddInfo("Article has 3 tags")`) only ever appear in the Validation tab, exactly as before — this is fully opt-in and requires no changes to existing validators.

### Related Properties

Sometimes a message is really about the relationship between two (or more) properties - for example, "Title requires a Subtitle to also be set". Pass any related properties as additional expressions and the badge appears on **all** of them, not just the primary one:

```csharp
messages.AddError<IHeaderControls>(
    "Title requires a Subtitle to also be set",
    x => x.Title, //Primary property
    relatedProperties: x => x.Subtitle);
```

Related property badges clear when one is edited. The Validation tab lists related properties by their friendly display name.

## Advanced Usage

### Configuration

Customize the validation behavior by adding settings to your `appsettings.json`:
```json
{
  "CustomValidator": {
    "TreatWarningsAsErrors": false,
    "CacheExpirationMinutes": 30,
    "EntityFlagMode": "Lazy"
  }
}
```

#### Configuration Options

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `TreatWarningsAsErrors` | `bool` | `false` | When `true`, treats all validation warnings as errors, blocking publish operations and showing inline field badges for warnings, same as errors |
| `CacheExpirationMinutes` | `int` | `30` | Duration in minutes that validation results are cached. Set to `0` to disable caching |
| `EntityFlagMode` | `string` | `Lazy` | Controls when validation flags appear on documents in the backoffice tree. See [Entity Flag Modes](#entity-flag-modes) |

### Examples

#### Strict Validation Mode
Treat all warnings as errors to enforce stricter content quality — warnings will also block
publishing and show a (red) inline field badge, just like errors:
```json
{
  "Umbraco": {
    "CMS": {
      "CustomValidator": {
        "TreatWarningsAsErrors": true
      }
    }
  }
}
```

#### Adjust Cache Duration
Increase cache duration for better performance or decrease for more frequent validation:
```json
{
  "Umbraco": {
    "CMS": {
      "CustomValidator": {
        "CacheExpirationMinutes": 60
      }
    }
  }
}
```

#### Disable Caching
Disable result caching for development or debugging:
```json
{
  "Umbraco": {
    "CMS": {
      "CustomValidator": {
        "CacheExpirationMinutes": 0
      }
    }
  }
}
```

### Entity Flag Modes

Custom Validator can display a error icon on documents in the backoffice content tree to indicate validation errors are present. The `EntityFlagMode` setting controls when this flag is evaluated.

| Mode | Value | Description |
|------|-------|-------------|
| `Lazy` | `1` (default) | Flag is shown only after the document has been opened and validated in the backoffice. Lowest overhead — reads from cache only |
| `Eager` | `2` | Flag is evaluated immediately when the tree loads. If no cached result exists, validation runs on-demand. Ensures flags are always accurate but increases server load |
| `None` | `0` | Flags are disabled entirely. No validation status is checked when rendering the tree |

#### Lazy Mode (Default)
Flags appear after a document has been visited. Ideal for most sites:
```json
{
  "CustomValidator": {
    "EntityFlagMode": "Lazy"
  }
}
```

#### Eager Mode
Flags appear immediately on tree load, even for unvisited documents. Best for editorial workflows where all content must be valid before publishing:
```json
{
  "CustomValidator": {
    "EntityFlagMode": "Eager"
  }
}
```

#### Disable Flags
Remove tree flags entirely if you only want validation in the workspace tab:
```json
{
  "CustomValidator": {
    "EntityFlagMode": "None"
  }
}
```

### Accessing Custom Services

Inject services into your validator constructor:

```csharp
public class ArticleValidator : BaseDocumentValidator<Article>
{
    private readonly IMediaService _mediaService;
    private readonly IApiService _apiService;

    public ArticleValidator(
        IMediaService mediaService,
        IApiService apiService)
    {
        _mediaService = mediaService;
        _apiService = apiService;
    }

    public override async Task<IEnumerable<ValidationMessage>> ValidateAsync(Article content)
    {
        // Use services for complex validation logic
        // ...
    }
}
```

### Validating Compositions 

Validate interfaces for reusable validation

```csharp
public class HeaderControlsValidator : BaseDocumentValidator<IHeaderControls>
{
    public override Task<IEnumerable<ValidationMessage>> ValidateAsync(IHeaderControls content)
    {
        var messages = new List<ValidationMessage>();

        if (string.IsNullOrWhiteSpace(content.Subtitle))
        {
            messages.AddWarning<IHeaderControls>("Subtitle empty", x => x.Subtitle);
        }

        if (string.IsNullOrWhiteSpace(content.Subtitle) && !string.IsNullOrWhiteSpace(content.Title))
        {
            messages.AddError<IHeaderControls>(
                "Title requires a Subtitle to also be set",
                x => x.Title,
                relatedProperties: x => x.Subtitle);
        }

        return Task.FromResult<IEnumerable<ValidationMessage>>(messages);
    }
}
```

The property expressions above work for mixin interfaces too (`IHeaderControls.Subtitle`) this just normalises the property name as it doesn't have context of the attribute for the actual alias. 

If your alias differs to your property name I suggest to use the strongly typed version of your composition i.e. `HeaderControls` instead.

### Building Messages Without the Fluent Helpers

The fluent `AddError`/`AddWarning`/`AddInfo` helpers are the recommended way to build messages, but `ValidationMessage` itself stays a plain, dependency-free record - construct it directly if you prefer, or if you already have the alias as a string.

```csharp
messages.Add(new ValidationMessage
{
    Message = "Article title is required",
    Severity = ValidationSeverity.Error,
    PropertyAlias = "title",
    RelatedPropertyAliases = new[] { "subtitle" } // optional
});
```

### Blocking Publishing

When validation errors (`ValidationSeverity.Error`) are present, a notification handler automatically blocks the content from being published, ensuring data quality and consistency.

### Caching

Custom Validator uses **HybridCache** for efficient validation result caching with tag-based invalidation.

#### Cache Keys

Validation results are cached using the following key format:
```
customValidation_{documentId}_{culture}
```

Examples:
- Invariant content: `customValidation_abc123_invariant`
- Variant content: `customValidation_abc123_en-US`

#### Cache Tags

Tags enable efficient bulk invalidation:
- `customValidation` - Global tag for all validation cache entries
- `customValidation:doc:{documentId}` - All cultures for a specific document
- `customValidation:doc:{documentId}:culture:{culture}` - Specific document and culture

#### Cache Invalidation

- Cache automatically clears when content is saved or published
- Default expiration: 30 minutes
- Configure via `CacheExpirationMinutes` in appsettings.json

#### Requirements

HybridCache is included with Umbraco 17+ and registered automatically.

## API

### BaseDocumentValidator<T>

Abstract base class for all validators.

**Methods:**
- `ValidateAsync(T content)` - Override this method to implement validation logic

### ValidationMessage

Record type representing a single validation message.

**Properties:**
- `Message` (string) - The validation message text
- `Severity` (ValidationSeverity) - The severity level (Error, Warning, Info)
- `PropertyAlias` (string?) - Optional property alias; when set, shows an inline field badge in addition to the Validation tab entry
- `RelatedPropertyAliases` (IEnumerable\<string\>?) - Optional additional property aliases that should also show this message's badge (e.g. cross-field validation)

### ValidationMessageCollectionExtensions

Fluent, strongly-typed extension methods on `ICollection<ValidationMessage>` for building messages without hand-typed alias strings. Property aliases are resolved from the expression via `[ImplementPropertyType]` where available, falling back to ModelsBuilder's own naming convention (lowercased property name) otherwise - so these work for both concrete generated models and mixin interfaces.

**Methods (each returns the collection, so calls can be chained):**
- `AddError<TContent>(string message, Expression<Func<TContent, object>> property, params Expression<Func<TContent, object>>[] relatedProperties)` where `TContent : IPublishedContent`
- `AddWarning<TContent>(...)` / `AddInfo<TContent>(...)` - same signature, different severity
- `AddError(string message)` / `AddWarning(string message)` / `AddInfo(string message)` - document-level overloads with no property alias

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

- **Backend (C#)**: Validation service, base validator class, fluent message-builder extensions, API controller
- **Frontend (TypeScript/Lit)**: Custom workspace view tab, per-variant validation context, inline field badges, UI components
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

- [Lottie Pitcher (Opinionated Package Starter)](https://github.com/LottePitcher/opinionated-package-starter)
- [Niels Lyngsø (24days.in)](https://24days.in/umbraco-cms/2025/backoffice-communication/)