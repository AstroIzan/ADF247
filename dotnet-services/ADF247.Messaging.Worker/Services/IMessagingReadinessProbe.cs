namespace ADF247.Messaging.Worker.Services;

public interface IMessagingReadinessProbe
{
    Task<MessagingReadinessResult> CheckAsync(CancellationToken cancellationToken);
}

public sealed record MessagingReadinessResult(bool IsReady, string Reason)
{
    public static MessagingReadinessResult Ready(string reason = "ready") => new(true, reason);
    public static MessagingReadinessResult NotReady(string reason) => new(false, reason);
}
