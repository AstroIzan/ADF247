namespace ADF247.Api.Models;

public sealed class AvailabilityWindow
{
    public int Id { get; set; }
    public required string UserNCarnet { get; set; }
    public DateTime FromDateTime { get; set; }
    public DateTime ToDateTime { get; set; }
    public required string AvailabilityType { get; set; }
    public required string Source { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public User? User { get; set; }
}
