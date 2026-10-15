namespace ADF247.Api.Models;

public sealed class PlaAlfaMunicipalitySelection
{
    public required string Municipality { get; set; }
    public bool IsPrincipal { get; set; }
    public int? SimulationTodayLevel { get; set; }
    public int? SimulationTomorrowLevel { get; set; }
    public DateTime UpdatedAt { get; set; }
}
