namespace ADF247.Api.Models;

public sealed class CampaignForm
{
    public int Id { get; set; }
    public int ConvocatoriaId { get; set; }
    public DateTime Dia { get; set; }
    public int? ResponsableId { get; set; }
    public string? ResponsableNCarnet { get; set; }
    public required string VoluntarisJson { get; set; }
    public required string VehiclesJson { get; set; }
    public required string ServiceMoment { get; set; }
    public string? CreatedByNCarnet { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Convocatoria? Convocatoria { get; set; }
}
