using Umbraco.Cms.Infrastructure.ModelsBuilder;
using Umbraco.Community.CustomValidator.Extensions;

namespace Umbraco.Community.CustomValidator.Tests.Extensions;

[TestFixture]
public sealed class PropertyAliasResolverTests
{
    private sealed class ConcreteWithAttribute
    {
        [ImplementPropertyType("customAlias")]
        public string Description { get; set; } = string.Empty;

        [ImplementPropertyType("isFeaturedAlias")]
        public bool IsFeatured { get; set; }
    }

    private interface IMixinStyle
    {
        string Subtitle { get; }

        bool IsActive { get; }
    }

    [Test]
    public void Resolve_WithImplementPropertyTypeAttribute_UsesAttributeAlias()
    {
        var alias = PropertyAliasResolver.Resolve<ConcreteWithAttribute>(x => x.Description);

        Assert.That(alias, Is.EqualTo("customAlias"));
    }

    [Test]
    public void Resolve_WithImplementPropertyTypeAttribute_ValueTypeProperty_UsesAttributeAlias()
    {
        // Value-type properties get boxed into a Convert node when selected as `object` -
        // this exercises that path while an attribute is still present.
        var alias = PropertyAliasResolver.Resolve<ConcreteWithAttribute>(x => x.IsFeatured);

        Assert.That(alias, Is.EqualTo("isFeaturedAlias"));
    }

    [Test]
    public void Resolve_WithoutAttribute_FallsBackToCamelCaseConvention()
    {
        // Simulates a mixin interface member (e.g. IHeaderControls.Subtitle), which never
        // carries [ImplementPropertyType] - only the concrete class override does.
        var alias = PropertyAliasResolver.Resolve<IMixinStyle>(x => x.Subtitle);

        Assert.That(alias, Is.EqualTo("subtitle"));
    }

    [Test]
    public void Resolve_WithoutAttribute_ValueTypeProperty_FallsBackToCamelCaseConvention()
    {
        var alias = PropertyAliasResolver.Resolve<IMixinStyle>(x => x.IsActive);

        Assert.That(alias, Is.EqualTo("isActive"));
    }

    [Test]
    public void Resolve_WithMethodCallExpression_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() =>
            PropertyAliasResolver.Resolve<IMixinStyle>(x => x.Subtitle.ToUpper()));
    }

    [Test]
    public void Resolve_WithNestedMemberAccess_ThrowsArgumentException()
    {
        // x.Subtitle.Length is a MemberExpression, but not directly on the lambda parameter -
        // must be rejected rather than silently resolving to "length".
        Assert.Throws<ArgumentException>(() =>
            PropertyAliasResolver.Resolve<IMixinStyle>(x => x.Subtitle.Length));
    }
}
