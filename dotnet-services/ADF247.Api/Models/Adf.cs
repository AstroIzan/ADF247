namespace ADF247.Api.Models;

public sealed class Adf
{
    public int Id { get; set; }
    public int Number { get; set; }
    public required string Name { get; set; }
    public string MunicipalitiesJson { get; set; } = "[]";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
