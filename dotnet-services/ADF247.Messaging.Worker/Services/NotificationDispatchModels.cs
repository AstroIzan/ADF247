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

public enum TaskExecutionEventType : byte
{
    Start = 1,
    Info = 2,
    Error = 3,
    Warning = 4,
    End = 5,
}

public sealed record TaskExecutionStartResult(
    bool ShouldRun,
    long? TaskExecutionId);

public sealed record RunbookQueueResult(
    bool NotificationQueued,
    long? NotificationId,
    string Status,
    string Message);
