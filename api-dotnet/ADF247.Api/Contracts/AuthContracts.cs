namespace ADF247.Api.Contracts;

public sealed record LoginRequest(string? NCarnet, string? Password);
public sealed record RefreshRequest(string? RefreshToken);

public sealed record RoleResponse(
    bool IsAdmin,
    bool IsGroc,
    bool IsCapColla,
    bool IsCapOperatiu);

public sealed record UserResponse(
    int Id,
    string NCarnet,
    string? NIndicatiu,
    string? Phone,
    string Name,
    string? LastName,
    bool IsActive,
    RoleResponse Roles,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public sealed record SessionResponse(
    string AccessToken,
    string TokenType,
    string ExpiresIn,
    string RefreshToken,
    string RefreshExpiresIn,
    UserResponse User);
