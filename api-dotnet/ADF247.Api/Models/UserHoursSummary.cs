namespace ADF247.Api.Models;

public sealed class UserHoursSummary
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public double CampaignHours { get; set; }
    public double OffCampaignHours { get; set; }
    public int UnansweredCount { get; set; }
    public int NoShowCount { get; set; }
    public double UnansweredPenaltyHours { get; set; }
    public double NoShowPenaltyHours { get; set; }
    public double TotalHours { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
