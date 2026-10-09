using ADF247.Api.Contracts;
using ADF247.Api.Data;
using ADF247.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ADF247.Api.Services;

public sealed class UserService(Adf247DbContext database)
{
    public async Task<IReadOnlyList<UserResponse>> GetAllAsync() =>
        (await database.Users.Include(user => user.Roles).OrderBy(user => user.Id).ToListAsync())
        .Select(MapUser)
        .ToList();

    public async Task<UserResponse?> GetByIdAsync(int id)
    {
        var user = await database.Users.Include(user => user.Roles)
            .SingleOrDefaultAsync(user => user.Id == id);
        return user is null ? null : MapUser(user);
    }

    public async Task<UserResponse?> CreateAsync(CreateUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.NCarnet)
            || string.IsNullOrWhiteSpace(request.Name)
            || string.IsNullOrWhiteSpace(request.Password))
        {
            return null;
        }

        var nCarnet = request.NCarnet.Trim();
        if (await database.Users.AnyAsync(user => user.NCarnet == nCarnet))
        {
            throw new InvalidOperationException("Ya existe un usuario con ese nCarnet.");
        }

        var user = new User
        {
            NCarnet = nCarnet,
            Name = request.Name.Trim(),
            LastName = NormalizeOptional(request.LastName),
            NIndicatiu = NormalizeOptional(request.NIndicatiu),
            Phone = NormalizeOptional(request.Phone),
            Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
            IsActive = request.IsActive ?? true,
            Roles = [CreateRole(nCarnet, request.Roles)],
        };

        database.Users.Add(user);
        await database.SaveChangesAsync();
        return MapUser(user);
    }

    public async Task<UserResponse?> UpdateAsync(int id, UpdateUserRequest request)
    {
        var user = await database.Users.Include(user => user.Roles)
            .SingleOrDefaultAsync(user => user.Id == id);
        if (user is null)
        {
            return null;
        }

        if (request.Name is not null)
        {
            user.Name = RequireText(request.Name, "name");
        }

        if (request.LastName is not null) user.LastName = NormalizeOptional(request.LastName);
        if (request.NIndicatiu is not null) user.NIndicatiu = NormalizeOptional(request.NIndicatiu);
        if (request.Phone is not null) user.Phone = NormalizeOptional(request.Phone);
        if (request.IsActive.HasValue) user.IsActive = request.IsActive.Value;
        if (request.Password is not null) user.Password = BCrypt.Net.BCrypt.HashPassword(RequireText(request.Password, "password"));

        if (request.Roles is not null)
        {
            var role = user.Roles.FirstOrDefault();
            if (role is null)
            {
                role = CreateRole(user.NCarnet, request.Roles);
                user.Roles.Add(role);
            }
            else
            {
                ApplyRoles(role, request.Roles);
            }
        }

        await database.SaveChangesAsync();
        return MapUser(user);
    }

    public async Task<UserResponse?> DeleteAsync(int id)
    {
        var user = await database.Users.Include(user => user.Roles)
            .SingleOrDefaultAsync(user => user.Id == id);
        if (user is null)
        {
            return null;
        }

        database.Roles.RemoveRange(user.Roles);
        database.Users.Remove(user);
        await database.SaveChangesAsync();
        return MapUser(user);
    }

    public static UserResponse MapUser(User user)
    {
        var role = user.Roles.FirstOrDefault();
        return new UserResponse(
            user.Id,
            user.NCarnet,
            user.NIndicatiu,
            user.Phone,
            user.Name,
            user.LastName,
            user.IsActive,
            new RoleResponse(
                role?.IsAdmin ?? false,
                role?.IsGroc ?? false,
                role?.IsCapColla ?? false,
                role?.IsCapOperatiu ?? false),
            user.CreatedAt,
            user.UpdatedAt);
    }

    private static Role CreateRole(string nCarnet, UserRolesRequest? request)
    {
        var role = new Role { NCarnet = nCarnet };
        if (request is not null) ApplyRoles(role, request);
        return role;
    }

    private static void ApplyRoles(Role role, UserRolesRequest request)
    {
        if (request.IsAdmin.HasValue) role.IsAdmin = request.IsAdmin.Value;
        if (request.IsGroc.HasValue) role.IsGroc = request.IsGroc.Value;
        if (request.IsCapColla.HasValue) role.IsCapColla = request.IsCapColla.Value;
        if (request.IsCapOperatiu.HasValue) role.IsCapOperatiu = request.IsCapOperatiu.Value;
    }

    private static string RequireText(string value, string fieldName) =>
        string.IsNullOrWhiteSpace(value)
            ? throw new ArgumentException($"El campo \"{fieldName}\" es obligatorio.")
            : value.Trim();

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
