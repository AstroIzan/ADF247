namespace ADF247.Api.Contracts;

public sealed record SystemConfigurationRequest(
    bool AutoCreateUnavailableForUsersWithoutWindow,
    bool NotifyOnAutoAvailableResponse,
    IReadOnlyList<int>? WeeklyConvoTypeIds,
    int WeeklyRequestWeekday,
    int WeeklyRequestHour,
    int WeeklyRequestMinute,
    IReadOnlyList<string>? AvailabilityManagerNCarnets,
    int PendingLeadDays,
    int PendingLeadHours,
    DateOnly? CampaignStartDate,
    DateOnly? CampaignEndDate,
    int UnansweredPenaltyThreshold,
    decimal UnansweredPenaltyHours,
    decimal NoShowPenaltyHours,
    IReadOnlyList<CampaignVehicleRequest>? VehicleCatalog);

public sealed record CampaignVehicleRequest(string Indicatiu, string? Modelo, decimal Kms);
