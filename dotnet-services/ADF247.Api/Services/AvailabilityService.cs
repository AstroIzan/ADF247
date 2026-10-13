using ADF247.Api.Contracts;
using ADF247.Api.Data;
using ADF247.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ADF247.Api.Services;

public sealed class AvailabilityService(
    Adf247DbContext database,
    ConvocatoriaCalculationService calculations)
{
    public async Task<IReadOnlyList<AvailabilityWindowResponse>> GetAllAsync(
        string currentNCarnet,
        bool isAdmin,
        string? requestedNCarnet,
        string? availabilityType,
        DateTime? from,
        DateTime? to)
    {
        var query = database.AvailabilityWindows.AsQueryable();
        query = query.Where(window => window.UserNCarnet == (isAdmin ? requestedNCarnet ?? window.UserNCarnet : currentNCarnet));
        if (availabilityType is not null) query = query.Where(window => window.AvailabilityType == availabilityType);
        if (from.HasValue) query = query.Where(window => window.ToDateTime > from.Value);
        if (to.HasValue) query = query.Where(window => window.FromDateTime < to.Value);

        return (await query.OrderBy(window => window.FromDateTime).ThenBy(window => window.Id).ToListAsync())
            .Select(Map)
            .ToList();
    }

    public async Task<AvailabilityWindowResponse> CreateAsync(
        AvailabilityWindowRequest request,
        string currentNCarnet,
        bool isAdmin)
    {
        var userNCarnet = ResolveCarnet(request.UserNCarnet, currentNCarnet, isAdmin);
        ValidateRequest(request, true);
        await EnsureUserAsync(userNCarnet);

        var window = new AvailabilityWindow
        {
            UserNCarnet = userNCarnet,
            FromDateTime = request.FromDateTime!.Value,
            ToDateTime = request.ToDateTime!.Value,
            AvailabilityType = request.AvailabilityType!.Trim(),
            Source = string.IsNullOrWhiteSpace(request.Source) ? "manual" : request.Source.Trim(),
            Notes = NormalizeOptional(request.Notes),
        };
        database.AvailabilityWindows.Add(window);
        await database.SaveChangesAsync();
        return await MergeAndApplyAsync(window);
    }

    public async Task<AvailabilityWindowResponse?> UpdateAsync(
        int id,
        AvailabilityWindowRequest request,
        string currentNCarnet,
        bool isAdmin)
    {
        var window = await database.AvailabilityWindows.SingleOrDefaultAsync(item => item.Id == id);
        if (window is null) return null;
        if (!isAdmin && window.UserNCarnet != currentNCarnet) throw new UnauthorizedAccessException();

        if (request.UserNCarnet is not null)
        {
            window.UserNCarnet = ResolveCarnet(request.UserNCarnet, currentNCarnet, isAdmin);
            await EnsureUserAsync(window.UserNCarnet);
        }
        if (request.FromDateTime.HasValue) window.FromDateTime = request.FromDateTime.Value;
        if (request.ToDateTime.HasValue) window.ToDateTime = request.ToDateTime.Value;
        if (request.AvailabilityType is not null) window.AvailabilityType = request.AvailabilityType.Trim();
        if (request.Source is not null) window.Source = request.Source.Trim();
        if (request.Notes is not null) window.Notes = NormalizeOptional(request.Notes);
        window.UpdatedAt = DateTime.UtcNow;

        ValidateWindow(window);
        await database.SaveChangesAsync();
        return await MergeAndApplyAsync(window);
    }

    public async Task<AvailabilityWindowResponse?> DeleteAsync(int id, string currentNCarnet, bool isAdmin)
    {
        var window = await database.AvailabilityWindows.SingleOrDefaultAsync(item => item.Id == id);
        if (window is null) return null;
        if (!isAdmin && window.UserNCarnet != currentNCarnet) throw new UnauthorizedAccessException();
        database.AvailabilityWindows.Remove(window);
        await database.SaveChangesAsync();
        return Map(window);
    }

    private async Task<AvailabilityWindowResponse> MergeAndApplyAsync(AvailabilityWindow window)
    {
        var overlaps = await database.AvailabilityWindows
            .Where(item => item.Id != window.Id
                && item.UserNCarnet == window.UserNCarnet
                && item.AvailabilityType == window.AvailabilityType
                && item.FromDateTime < window.ToDateTime
                && item.ToDateTime > window.FromDateTime)
            .ToListAsync();

        if (overlaps.Count > 0)
        {
            window.FromDateTime = new[] { window.FromDateTime }.Concat(overlaps.Select(item => item.FromDateTime)).Min();
            window.ToDateTime = new[] { window.ToDateTime }.Concat(overlaps.Select(item => item.ToDateTime)).Max();
            database.AvailabilityWindows.RemoveRange(overlaps);
            await database.SaveChangesAsync();
        }

        var convos = await database.Convocatorias
            .Where(convo => convo.IsActive && convo.StartTime < window.ToDateTime
                && (convo.FinalTime == null ? convo.StartTime >= window.FromDateTime : convo.FinalTime > window.FromDateTime))
            .ToListAsync();
        foreach (var convo in convos) await calculations.ApplyAvailabilityAsync(convo);

        return Map(window);
    }

    private async Task EnsureUserAsync(string nCarnet)
    {
        if (!await database.Users.AnyAsync(user => user.NCarnet == nCarnet))
            throw new KeyNotFoundException("No existe el usuario indicado en \"userNCarnet\".");
    }

    private static string ResolveCarnet(string? requested, string current, bool isAdmin)
    {
        var carnet = string.IsNullOrWhiteSpace(requested) ? current : requested.Trim();
        if (!isAdmin && carnet != current) throw new UnauthorizedAccessException();
        return carnet;
    }

    private static void ValidateRequest(AvailabilityWindowRequest request, bool creating)
    {
        if (creating && (!request.FromDateTime.HasValue || !request.ToDateTime.HasValue || string.IsNullOrWhiteSpace(request.AvailabilityType)))
            throw new ArgumentException("fromDateTime, toDateTime y availabilityType son obligatorios.");
        if (request.AvailabilityType is not null && request.AvailabilityType is not ("available" or "unavailable"))
            throw new ArgumentException("El campo \"availabilityType\" debe ser \"available\" o \"unavailable\".");
        if (request.Source is not null && request.Source is not ("manual" or "import" or "system"))
            throw new ArgumentException("El campo \"source\" debe ser \"manual\", \"import\" o \"system\".");
    }

    private static void ValidateWindow(AvailabilityWindow window)
    {
        if (window.ToDateTime <= window.FromDateTime)
            throw new ArgumentException("El rango no es valido: \"toDateTime\" debe ser posterior a \"fromDateTime\".");
        if (window.AvailabilityType is not ("available" or "unavailable"))
            throw new ArgumentException("El campo \"availabilityType\" debe ser \"available\" o \"unavailable\".");
        if (window.Source is not ("manual" or "import" or "system"))
            throw new ArgumentException("El campo \"source\" debe ser \"manual\", \"import\" o \"system\".");
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static AvailabilityWindowResponse Map(AvailabilityWindow window) =>
        new(window.Id, window.UserNCarnet, window.FromDateTime, window.ToDateTime,
            window.AvailabilityType, window.Source, window.Notes, window.CreatedAt, window.UpdatedAt);
}
