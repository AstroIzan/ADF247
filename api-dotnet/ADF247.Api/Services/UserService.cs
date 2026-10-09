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

    public async Task<object> GetPageAsync(int page, int pageSize)
    {
        if (page < 1 || pageSize < 1) throw new ArgumentException("page y pageSize deben ser enteros positivos.");
        var query = database.Users.Include(user => user.Roles).OrderBy(user => user.Id);
        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return new { items = items.Select(MapUser).ToList(), pagination = new { page, pageSize, total, totalPages = Math.Max(1, (int)Math.Ceiling(total / (double)pageSize)) } };
    }

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
        if (request.NCarnet is not null)
        {
            var nCarnet = RequireText(request.NCarnet, "nCarnet");
            if (nCarnet != user.NCarnet)
            {
                if (await database.Respuestas.AnyAsync(response => response.UserNCarnet == user.NCarnet))
                    throw new InvalidOperationException("No se puede cambiar nCarnet porque el usuario tiene respuestas asociadas.");
                if (await database.Users.AnyAsync(existing => existing.NCarnet == nCarnet))
                    throw new InvalidOperationException("Ya existe un usuario con ese nCarnet.");
                user.NCarnet = nCarnet;
                foreach (var role in user.Roles) role.NCarnet = nCarnet;
            }
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

    public async Task<object> ImportAsync(ImportUsersRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CsvContent)) throw new ArgumentException("csvContent es obligatorio.");
        var lines = request.CsvContent.Replace("\r\n", "\n").Replace('\r', '\n').Split('\n', StringSplitOptions.RemoveEmptyEntries);
        if (lines.Length < 2) throw new ArgumentException("El CSV debe incluir cabecera y al menos una fila.");
        var header = ParseCsvLine(lines[0]).Select(value => value.Trim()).ToArray();
        var required = new[] { "nCarnet", "name", "password" };
        if (required.Any(field => !header.Contains(field, StringComparer.OrdinalIgnoreCase))) throw new ArgumentException("El CSV debe contener nCarnet, name y password.");
        var indexes = header.Select((value, index) => new { value, index }).ToDictionary(item => item.value, item => item.index, StringComparer.OrdinalIgnoreCase);
        var inserted = 0; var rejected = new List<object>();
        for (var row = 1; row < lines.Length; row++)
        {
            try
            {
                var values = ParseCsvLine(lines[row]);
                string? Value(string field) => indexes.TryGetValue(field, out var index) && index < values.Count ? values[index] : null;
                await CreateAsync(new CreateUserRequest(Value("nCarnet"), Value("name"), Value("password"), Value("lastName"), Value("nIndicatiu"), Value("phone"), ParseBoolean(Value("isActive")), new UserRolesRequest(ParseBoolean(Value("isAdmin")), ParseBoolean(Value("isGroc")), ParseBoolean(Value("isCapColla")), ParseBoolean(Value("isCapOperatiu")))));
                inserted++;
            }
            catch (Exception error) when (error is ArgumentException or InvalidOperationException) { rejected.Add(new { row = row + 1, message = error.Message }); }
        }
        return new { totalRows = lines.Length - 1, inserted, rejected = rejected.Count, rows = rejected };
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

    private static bool? ParseBoolean(string? value) => string.IsNullOrWhiteSpace(value) ? null : bool.TryParse(value.Trim(), out var parsed) ? parsed : throw new ArgumentException("Los campos booleanos del CSV deben ser true o false.");
    private static List<string> ParseCsvLine(string line)
    {
        var values = new List<string>(); var current = new System.Text.StringBuilder(); var quoted = false;
        foreach (var character in line)
        {
            if (character == '"') quoted = !quoted;
            else if (character == ',' && !quoted) { values.Add(current.ToString().Trim()); current.Clear(); }
            else current.Append(character);
        }
        if (quoted) throw new ArgumentException("El CSV contiene comillas sin cerrar.");
        values.Add(current.ToString().Trim());
        return values;
    }
}
