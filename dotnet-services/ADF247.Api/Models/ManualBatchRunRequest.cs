namespace ADF247.Api.Models;

public sealed class ManualBatchRunRequest
{
    public long Id { get; set; }
    public required string RequestedByNCarnet { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public string? ErrorMessage { get; set; }
}
