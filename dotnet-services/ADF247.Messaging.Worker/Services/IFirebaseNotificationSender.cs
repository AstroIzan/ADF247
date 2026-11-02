namespace ADF247.Messaging.Worker.Services;

public interface IFirebaseNotificationSender
{
    Task<string> SendAsync(
        string token,
        string title,
        string body,
        IReadOnlyDictionary<string, string> data,
        string collapseTag,
        CancellationToken cancellationToken);
}
