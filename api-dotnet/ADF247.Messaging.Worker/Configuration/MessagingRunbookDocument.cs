namespace ADF247.Messaging.Worker.Configuration;

public sealed class MessagingRunbookDocument
{
    public MessagingWorkerOptions MessagingWorker { get; set; } = new();
    public MessagingRunbookOptions MessagingRunbook { get; set; } = new();
}

public sealed record MessagingRunbookSnapshot(
    MessagingWorkerOptions Worker,
    MessagingRunbookOptions Runbook,
    bool IsStale,
    DateTimeOffset LoadedAtUtc,
    string? Warning);
