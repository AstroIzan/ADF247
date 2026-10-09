namespace ADF247.Api.Contracts;

public sealed record ConvoTypeRequest(string? Name, int? MinGrocSortida, int? MinVerdSortida, string? DefaultLocation);
public sealed record ConvocatoriaRequest(DateTime? Date, string? Title, string? UbiSortida, int? ResponsableId, int? ConvoTypeId, DateTime? StartTime, DateTime? FinalTime, bool? IsActive, bool? AutoAssignResponsable, bool? Sortida);
public sealed record LifecycleRequest(DateTime? ActualStartTime, DateTime? ActualEndTime);
public sealed record VehicleRequest(string? VehicleName, double? Kms, int? ConductorUserId, IReadOnlyList<int>? VolunteerUserIds);
public sealed record CampaignFormRequest(DateTime? Dia, IReadOnlyList<int>? VolunteerUserIds, IReadOnlyList<VehicleRequest>? Vehicles);
