namespace ADF247.Api.Services;

// Scoped per request/job. A null AdfId means "no ADF scoping" (anonymous calls,
// workers and the global panel for admin/secretariat).
public sealed class CurrentAdf
{
    public int? AdfId { get; set; }
}
