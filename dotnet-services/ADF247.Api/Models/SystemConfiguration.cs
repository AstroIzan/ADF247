namespace ADF247.Api.Models;

public sealed class SystemConfiguration
{
    public int Id { get; set; }
    public bool AutoCreateUnavailableForUsersWithoutWindow { get; set; }
    public bool NotifyOnAutoAvailableResponse { get; set; }
    public required string WeeklyConvoTypeIdsJson { get; set; }
    public required string WeeklyConvocatoriaSchedulesJson { get; set; }
    public int WeeklyRequestWeekday { get; set; }
    public int WeeklyRequestHour { get; set; }
    public int WeeklyRequestMinute { get; set; }
    public required string AvailabilityManagerNCarnetsJson { get; set; }
    public int PendingLeadDays { get; set; }
    public int PendingLeadHours { get; set; }
    public DateOnly? CampaignStartDate { get; set; }
    public DateOnly? CampaignEndDate { get; set; }
    public int UnansweredPenaltyThreshold { get; set; }
    public decimal UnansweredPenaltyHours { get; set; }
    public decimal NoShowPenaltyHours { get; set; }
    public required string VehicleCatalogJson { get; set; }
    public DateTime UpdatedAt { get; set; }
}
