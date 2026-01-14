// using Umbraco.Cms.Core.Composing;
// using Umbraco.Cms.Core.Events;
// using Umbraco.Forms.Core.Services.Notifications;

// public class FormNotificationComposer : IComposer
// {
//     public void Compose(IUmbracoBuilder builder)
//     {
//         builder.AddNotificationHandler<RecordSubmittedNotification, FormSubmittedHandler>();
//     }
// }

// public class FormSubmittedHandler(ILogger<FormSubmittedHandler> logger) : INotificationHandler<RecordSubmittedNotification>
// {
//     public void Handle(RecordSubmittedNotification notification)
//     {
//         logger.LogInformation("TestNotification triggered.");

//         var test = notification;
//     }
// }