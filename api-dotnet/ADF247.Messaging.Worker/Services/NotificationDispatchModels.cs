namespace ADF247.Messaging.Worker.Services;

public sealed record ClaimedNotification(
    long Id,
    int? ConvocatoriaId,
    string Trigger,
    string Title,
    string Body,
    string? PayloadJson);

public sealed record ClaimedDelivery(
    long Id,
    int DeviceRegistrationId,
    int UserId,
    string NCarnet,
    string Token);

public enum RecipientSelectionBehavior
{
    BroadcastAllDevices = 0,
    ConvocatoriaResponseRequest = 1,
    ConvocatoriaSortidaStatus = 2,
}

public sealed record NotificationRecipientSelection(
    RecipientSelectionBehavior Behavior,
    string Tag);

public sealed record RunbookExecutionStartResult(
    bool ShouldRun,
    long? ExecutionId);

public sealed record RunbookQueueResult(
    bool NotificationQueued,
    long? NotificationId,
    string Status,
    string Message);
