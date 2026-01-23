namespace Umbraco.Community.CustomValidator;

public sealed class CustomValidatorOptions
{
    public bool TreatWarningsAsErrors { get; set; } = true;

    public int CacheExpirationMinutes { get; set; } = 30;
}
