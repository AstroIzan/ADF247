namespace ADF247.Api.Contracts;

public sealed record SystemConfigurationRequest(
    bool AutoCreateUnavailableForUsersWithoutWindow,
    bool NotifyOnAutoAvailableResponse,
    bool PviEnabled,
    IReadOnlyList<int>? WeeklyConvoTypeIds,
    IReadOnlyList<int>? CampaignHoursConvoTypeIds,
    IReadOnlyList<WeeklyConvocatoriaScheduleRequest>? WeeklyConvocatoriaSchedules,
    int WeeklyRequestWeekday,
    int WeeklyRequestHour,
    int WeeklyRequestMinute,
    IReadOnlyList<string>? AvailabilityManagerNCarnets,
    int DailyNotificationsHour,
    int DailyNotificationsMinute,
    DateOnly? CampaignStartDate,
    DateOnly? CampaignEndDate,
    int UnansweredPenaltyThreshold,
    decimal UnansweredPenaltyHours,
    decimal NoShowPenaltyHours,
    IReadOnlyList<CampaignVehicleRequest>? VehicleCatalog);

public sealed record CampaignVehicleRequest(string Indicatiu, string? Modelo, decimal Litres, decimal Kms, string? Matricula = null);

public sealed record WeeklyConvocatoriaScheduleRequest(
    int ConvoTypeId,
    int DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime);

public sealed record PlaAlfaSimulationRequest(int? TodayLevel, int? TomorrowLevel);
public sealed record RunBatchRequest(string? Runbook);
