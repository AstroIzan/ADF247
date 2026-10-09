namespace ADF247.Api.Models;

public sealed class DeviceRegistration
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public required string NCarnet { get; set; }
    public required string Token { get; set; }
    public required string Platform { get; set; }
    public string? UserAgent { get; set; }
    public bool IsActive { get; set; }
    public DateTime RegisteredAt { get; set; }
    public DateTime LastSeenAt { get; set; }
    public DateTime? InvalidatedAt { get; set; }
    public string? InvalidReason { get; set; }
    public User? User { get; set; }
}

public sealed class MessagingConfiguration
{
    public int Id { get; set; }
    public required string Key { get; set; }
    public required string Name { get; set; }
    public required string TitleTemplate { get; set; }
    public required string BodyTemplate { get; set; }
    public required string AudienceRuleJson { get; set; }
    public bool Enabled { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class MessagingNotification
{
    public long Id { get; set; }
    public int? ConfigurationId { get; set; }
    public int? ConvocatoriaId { get; set; }
    public required string Trigger { get; set; }
    public required string Status { get; set; }
    public required string Title { get; set; }
    public required string Body { get; set; }
    public string? PayloadJson { get; set; }
    public DateTime? ScheduledFor { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int RequestedCount { get; set; }
    public int SuccessCount { get; set; }
    public int FailureCount { get; set; }
    public int? ActorUserId { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; }
    public MessagingConfiguration? Configuration { get; set; }
    public Convocatoria? Convocatoria { get; set; }
    public User? Actor { get; set; }
}

public sealed class NotificationDelivery
{
    public long Id { get; set; }
    public long NotificationId { get; set; }
    public int DeviceRegistrationId { get; set; }
    public int UserId { get; set; }
    public required string NCarnet { get; set; }
    public required string Status { get; set; }
    public int AttemptCount { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; }
    public MessagingNotification? Notification { get; set; }
    public DeviceRegistration? DeviceRegistration { get; set; }
    public User? User { get; set; }
}

public sealed class RunbookExecution
{
    public long Id { get; set; }
    public required string RunbookKey { get; set; }
    public required string Trigger { get; set; }
    public required string Status { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public string? DetailsJson { get; set; }
    public string? ErrorMessage { get; set; }
}
