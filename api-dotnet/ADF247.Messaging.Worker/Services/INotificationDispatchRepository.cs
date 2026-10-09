namespace ADF247.Messaging.Worker.Services;

public interface INotificationDispatchRepository
{
    Task<RunbookExecutionStartResult> TryStartRunbookExecutionAsync(
        string runbookKey,
        string trigger,
        DateTimeOffset localMinute,
        string? detailsJson,
        CancellationToken cancellationToken);
    Task CompleteRunbookExecutionAsync(
        long executionId,
        string status,
        string? detailsJson,
        string? errorMessage,
        CancellationToken cancellationToken);
    Task<RunbookQueueResult> QueueNotificationFromConfigurationAsync(
        string runbookKey,
        string templateKey,
        string notificationTrigger,
        string? payloadJson,
        CancellationToken cancellationToken);
    Task<IReadOnlyList<ClaimedNotification>> ClaimQueuedNotificationsAsync(int batchSize, CancellationToken cancellationToken);
    Task<int> EnsureNotificationDeliveriesAsync(
        long notificationId,
        int? convocatoriaId,
        RecipientSelectionBehavior selectionBehavior,
        CancellationToken cancellationToken);
    Task<int> RequeueRetryableDeliveriesAsync(long notificationId, int maxAttempts, CancellationToken cancellationToken);
    Task<IReadOnlyList<ClaimedDelivery>> ClaimPendingDeliveriesAsync(long notificationId, int batchSize, CancellationToken cancellationToken);
    Task<int> MarkInactivePendingDeliveriesFailedAsync(long notificationId, CancellationToken cancellationToken);
    Task MarkDeliverySentAsync(long deliveryId, CancellationToken cancellationToken);
    Task MarkDeliveryFailedAsync(long deliveryId, string errorCode, string errorMessage, CancellationToken cancellationToken);
    Task InvalidateDeviceRegistrationAsync(int deviceRegistrationId, string reason, CancellationToken cancellationToken);
    Task FinalizeNotificationAsync(long notificationId, int maxAttempts, CancellationToken cancellationToken);
    Task FailNotificationAsync(long notificationId, string errorMessage, CancellationToken cancellationToken);
}
