namespace ADF247.Api.Contracts;

public sealed record RespuestaRequest(
    int? ConvoId,
    string? UserNCarnet,
    bool? IsCustom,
    string? CustomText,
    bool? FullHorari,
    bool? Response,
    bool? AttendanceConfirmed,
    bool? AttendanceJustified);

public sealed record RespuestaResponse(
    int Id,
    int ConvoId,
    object? Convocatoria,
    string UserNCarnet,
    object? User,
    bool IsCustom,
    string? CustomText,
    bool FullHorari,
    bool Response,
    bool AttendanceConfirmed,
    bool AttendanceJustified,
    string Source,
    string? AutoAssignReason);
