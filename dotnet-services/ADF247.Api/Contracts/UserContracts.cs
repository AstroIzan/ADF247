namespace ADF247.Api.Contracts;

public sealed record UserRolesRequest(
    bool? IsAdmin,
    bool? IsGroc,
    bool? IsCapColla,
    bool? IsCapOperatiu,
    bool? IsDeveloper,
    bool? IsSecretariat = null);

public sealed record CreateUserRequest(
    string? NCarnet,
    string? Name,
    string? Password,
    string? LastName,
    string? NIndicatiu,
    string? Phone,
    bool? IsActive,
    UserRolesRequest? Roles,
    int? AdfId = null);

public sealed record UpdateUserRequest(
    string? NCarnet,
    string? Name,
    string? Password,
    string? LastName,
    string? NIndicatiu,
    string? Phone,
    bool? IsActive,
    UserRolesRequest? Roles,
    int? AdfId = null);

public sealed record ImportUsersRequest(string? CsvContent, string? FileName);
