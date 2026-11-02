namespace ADF247.Api.Models;

public sealed class Vehicle
{
    public int Id { get; set; }
    public int AdfId { get; set; }
    public required string Indicatiu { get; set; }
    public string? Modelo { get; set; }
    public string? Matricula { get; set; }
    public decimal Litres { get; set; }
    public decimal Kms { get; set; }
}
