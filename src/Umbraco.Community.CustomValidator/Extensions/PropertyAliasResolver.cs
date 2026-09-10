using System.Linq.Expressions;
using System.Reflection;
using Umbraco.Cms.Infrastructure.ModelsBuilder;

namespace Umbraco.Community.CustomValidator.Extensions;

/// <summary>
/// Resolves the Umbraco property alias for a strongly-typed property-selector expression
/// (e.g. <c>x => x.Subtitle</c>), for use by the <see cref="ValidationMessageCollectionExtensions"/>
/// fluent helpers.
/// </summary>
internal static class PropertyAliasResolver
{
    /// <summary>
    /// Resolves the property alias referenced by <paramref name="propertySelector"/>.
    /// </summary>
    /// <remarks>
    /// Umbraco ModelsBuilder only stamps <see cref="ImplementPropertyTypeAttribute"/> on the
    /// generated CONCRETE content type's property override (e.g. <c>Home.Subtitle</c>) — it is
    /// never present on a mixin INTERFACE member (e.g. <c>IHeaderControls.Subtitle</c>), since
    /// interfaces don't inherit attributes from implementing classes. Validators commonly target
    /// the mixin interface (so one validator applies across every content type that implements
    /// it), so resolution is hybrid: prefer the attribute when present (concrete classes), and
    /// fall back to ModelsBuilder's own naming convention — lowercasing the first letter of the
    /// property name — when it isn't (mixin interfaces). This convention is exactly how
    /// ModelsBuilder derives a property name from an alias in the first place, so it is reliable
    /// for every ModelsBuilder-generated property.
    /// </remarks>
    /// <exception cref="ArgumentException">
    /// Thrown when <paramref name="propertySelector"/> is not a simple property access
    /// (e.g. a method call or nested member access).
    /// </exception>
    public static string Resolve<TContent>(Expression<Func<TContent, object>> propertySelector)
    {
        var member = ExtractMember(propertySelector);

        // Present on concrete ModelsBuilder-generated class property overrides; absent on
        // mixin interface members (see remarks above).
        var implementAttribute = member.GetCustomAttribute<ImplementPropertyTypeAttribute>();

        return implementAttribute?.Alias ?? ToCamelCase(member.Name);
    }

    private static MemberInfo ExtractMember(LambdaExpression propertySelector)
    {
        var memberExpression = propertySelector.Body switch
        {
            MemberExpression member => member,
            // Value-type properties (e.g. bool) are boxed to `object`, wrapping the member
            // access in a Convert node - reference-type properties (e.g. string) usually aren't.
            UnaryExpression { NodeType: ExpressionType.Convert, Operand: MemberExpression member } => member,
            _ => throw new ArgumentException(
                $"Expression '{propertySelector}' must be a simple property access, e.g. x => x.PropertyAlias.",
                nameof(propertySelector))
        };

        // Guard against nested access (e.g. x => x.Prop.Length) - the member must be accessed
        // directly on the lambda's own parameter, not on some other expression.
        if (memberExpression.Expression != propertySelector.Parameters[0])
        {
            throw new ArgumentException(
                $"Expression '{propertySelector}' must be a simple property access directly on the lambda parameter, e.g. x => x.PropertyAlias.",
                nameof(propertySelector));
        }

        return memberExpression.Member;
    }

    private static string ToCamelCase(string name) =>
        string.IsNullOrEmpty(name) ? name : char.ToLowerInvariant(name[0]) + name[1..];
}
