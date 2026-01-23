namespace Umbraco.Community.CustomValidator.Tests.Validation;

using Umbraco.Cms.Core.Models.PublishedContent;

// Test interfaces
public interface IHomePage : IPublishedContent { }
public interface IArticlePage : IPublishedContent { }

public interface IBasePage { }

public interface IHomePageWithBase : IPublishedContent, IBasePage { }
