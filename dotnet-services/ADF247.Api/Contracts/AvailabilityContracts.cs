namespace ADF247.Api.Contracts;

public sealed record AvailabilityWindowRequest(
    string? UserNCarnet,
    DateTime? FromDateTime,
    DateTime? ToDateTime,
    string? AvailabilityType,
    string? Source,
    string? Notes);

public sealed record AvailabilityWindowResponse(
    int Id,
    string UserNCarnet,
    DateTime FromDateTime,
    DateTime ToDateTime,
    string AvailabilityType,
    string Source,
    string? Notes,
    DateTime CreatedAt,
    DateTime UpdatedAt);
