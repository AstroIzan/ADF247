namespace ADF247.Api.Models;

public sealed class ConvoType
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public int MinGrocSortida { get; set; }
    public int MinVerdSortida { get; set; }
    public string? DefaultLocation { get; set; }
}
