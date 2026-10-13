namespace ADF247.Messaging.Worker.Configuration;

public sealed class MessagingWorkerOptions
{
    public const string SectionName = "MessagingWorker";

    public int PollingIntervalSeconds { get; set; } = 30;
    public int NotificationClaimBatchSize { get; set; } = 10;
    public int DeliveryClaimBatchSize { get; set; } = 200;
    public int MaxDeliveryAttempts { get; set; } = 3;
}
