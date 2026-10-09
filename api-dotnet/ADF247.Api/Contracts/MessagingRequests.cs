namespace ADF247.Api.Contracts;

public sealed record DeviceRegistrationRequest(string Token, string Platform, string? UserAgent);

public sealed record BroadcastNotificationRequest(string Title, string Body, Dictionary<string, string>? Data);

public sealed record ConvocatoriaNotificationRequest(string? Title, string? Body);

public sealed record MessagingConfigurationRequest(
    string Key,
    string Name,
    string TitleTemplate,
    string BodyTemplate,
    string AudienceRuleJson,
    bool Enabled);
