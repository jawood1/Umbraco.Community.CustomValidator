namespace Umbraco.Community.CustomValidator;

public sealed class CustomValidatorOptions
{
    public bool TreatWarningsAsErrors { get; set; } = false;

    public int CacheExpirationMinutes { get; set; } = 30;
}
