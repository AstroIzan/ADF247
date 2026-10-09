namespace ADF247.Api.Models;

public sealed class Convocatoria
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public required string Title { get; set; }
    public required string UbiSortida { get; set; }
    public int? ResponsableId { get; set; }
    public int ConvoTypeId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? FinalTime { get; set; }
    public DateTime? ActualStartTime { get; set; }
    public DateTime? ActualEndTime { get; set; }
    public bool IsActive { get; set; }
    public bool AutoAssignResponsable { get; set; }
    public bool Sortida { get; set; }
    public User? Responsable { get; set; }
    public ConvoType? ConvoType { get; set; }
}
