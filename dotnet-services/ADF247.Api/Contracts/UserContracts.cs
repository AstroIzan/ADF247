namespace ADF247.Api.Contracts;

public sealed record UserRolesRequest(
    bool? IsAdmin,
    bool? IsGroc,
    bool? IsCapColla,
    bool? IsCapOperatiu);

public sealed record CreateUserRequest(
    string? NCarnet,
    string? Name,
    string? Password,
    string? LastName,
    string? NIndicatiu,
    string? Phone,
    bool? IsActive,
    UserRolesRequest? Roles);

public sealed record UpdateUserRequest(
    string? NCarnet,
    string? Name,
    string? Password,
    string? LastName,
    string? NIndicatiu,
    string? Phone,
    bool? IsActive,
    UserRolesRequest? Roles);

public sealed record ImportUsersRequest(string? CsvContent, string? FileName);
