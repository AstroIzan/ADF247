namespace ADF247.Api.Models;

public sealed class Respuesta
{
    public int Id { get; set; }
    public int ConvoId { get; set; }
    public required string UserNCarnet { get; set; }
    public bool IsCustom { get; set; }
    public string? CustomText { get; set; }
    public bool FullHorari { get; set; }
    public bool Response { get; set; }
    public bool AttendanceConfirmed { get; set; }
    public bool AttendanceJustified { get; set; }
    public required string Source { get; set; }
    public string? AutoAssignReason { get; set; }
    public Convocatoria? Convocatoria { get; set; }
    public User? User { get; set; }
}
