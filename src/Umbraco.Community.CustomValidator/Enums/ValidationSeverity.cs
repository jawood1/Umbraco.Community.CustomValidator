using System.Text.Json.Serialization;

namespace Umbraco.Community.CustomValidator.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ValidationSeverity
{
    Info,
    Warning,
    Error
}