namespace ADF247.Messaging.Worker.Services;

public interface INotificationDispatchRepository
{
    Task<TaskExecutionStartResult> TryStartTaskExecutionAsync(
        string taskDefinitionName,
        DateTimeOffset localMinute,
        string startMessage,
        string? startDetailsJson,
        CancellationToken cancellationToken);
    Task AddTaskExecutionDetailAsync(
        long taskExecutionId,
        TaskExecutionEventType eventType,
        string message,
        string? detailsJson,
        CancellationToken cancellationToken);
    Task CompleteTaskExecutionAsync(
        long taskExecutionId,
        string status,
        string endMessage,
        string? endDetailsJson,
        CancellationToken cancellationToken);
    Task<IReadOnlyList<ClaimedNotification>> ClaimQueuedNotificationsAsync(int batchSize, CancellationToken cancellationToken);
    Task<int> EnsureNotificationDeliveriesAsync(
        long notificationId,
        int? convocatoriaId,
        RecipientSelectionBehavior selectionBehavior,
        IReadOnlyCollection<string>? recipientNCarnets,
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
