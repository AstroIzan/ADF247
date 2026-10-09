namespace ADF247.Api.Models;

public sealed class Role
{
    public int Id { get; set; }
    public required string NCarnet { get; set; }
    public bool IsCapOperatiu { get; set; }
    public bool IsCapColla { get; set; }
    public bool IsAdmin { get; set; }
    public bool IsGroc { get; set; }
    public User? User { get; set; }
}
