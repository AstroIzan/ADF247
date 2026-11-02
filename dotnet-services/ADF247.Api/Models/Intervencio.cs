namespace ADF247.Api.Models;

public sealed class TypeIncendi
{
    public int Id { get; set; }
    public required string Name { get; set; }
}

public sealed class Intervencio
{
    public int Id { get; set; }
    public int AdfId { get; set; }
    public int? ConvocatoriaId { get; set; }
    public int? ResponsableUserId { get; set; }
    public string? ResponsableName { get; set; }
    public string? ResponsableAdf { get; set; }
    public DateOnly Date { get; set; }
    public TimeOnly? NoticeTime { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public int? Level { get; set; }
    public string? MapsUrl { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? Municipality { get; set; }
    public string? Sector { get; set; }
    public string? Comarca { get; set; }
    public string OwnVehiclesJson { get; set; } = "[]";
    public string? FirstInterventionVehicle { get; set; }
    public bool OtherAdfsAttended { get; set; }
    public string OtherAdfsJson { get; set; } = "[]";
    public int OtherAdfsGrocs { get; set; }
    public int OtherAdfsVerds { get; set; }
    public bool BombersAttended { get; set; }
    public string BombersJson { get; set; } = "[]";
    public int OwnGrocs { get; set; }
    public int OwnVerds { get; set; }
    public int CustomGrocs { get; set; }
    public int CustomVerds { get; set; }
    public decimal? Surface { get; set; }
    public int? TypeIncendiId { get; set; }
    public string? CreatedByNCarnet { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Convocatoria? Convocatoria { get; set; }
    public User? Responsable { get; set; }
    public TypeIncendi? TypeIncendi { get; set; }
}
