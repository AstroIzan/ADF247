namespace ADF247.Api.Models;

public sealed class User
{
    public int Id { get; set; }
    public required string NCarnet { get; set; }
    public string? NIndicatiu { get; set; }
    public required string Name { get; set; }
    public string? LastName { get; set; }
    public required string Password { get; set; }
    public bool IsActive { get; set; }
    public string? Phone { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<Role> Roles { get; set; } = [];
}
