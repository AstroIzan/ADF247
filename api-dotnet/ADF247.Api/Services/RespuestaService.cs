using ADF247.Api.Contracts;
using ADF247.Api.Data;
using ADF247.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ADF247.Api.Services;

public sealed class RespuestaService(
    Adf247DbContext database,
    ConvocatoriaCalculationService calculations)
{
    public async Task<IReadOnlyList<RespuestaResponse>> GetAllAsync(string currentCarnet, bool isAdmin, int? convoId, string? userCarnet)
    {
        var query = database.Respuestas
            .Include(item => item.User)
            .Include(item => item.Convocatoria)
                .ThenInclude(convo => convo!.ConvoType)
            .AsQueryable();
        if (!isAdmin) query = query.Where(item => item.UserNCarnet == currentCarnet);
        else if (!string.IsNullOrWhiteSpace(userCarnet)) query = query.Where(item => item.UserNCarnet == userCarnet);
        if (convoId.HasValue) query = query.Where(item => item.ConvoId == convoId);
        return (await query.OrderBy(item => item.Id).ToListAsync()).Select(Map).ToList();
    }

    public async Task<RespuestaResponse> CreateAsync(RespuestaRequest request, string currentCarnet, bool isAdmin)
    {
        if (!request.ConvoId.HasValue) throw new ArgumentException("convoId es obligatorio.");
        var userCarnet = ResolveCarnet(request.UserNCarnet, currentCarnet, isAdmin);
        var convo = await GetConvocatoriaAsync(request.ConvoId.Value);
        EnsureResponseWindow(convo, isAdmin);
        if (await database.Respuestas.AnyAsync(item => item.ConvoId == convo.Id && item.UserNCarnet == userCarnet))
            throw new InvalidOperationException("Ya existe una respuesta para esta convocatoria y usuario.");
        if (!await database.Users.AnyAsync(user => user.NCarnet == userCarnet))
            throw new KeyNotFoundException("No existe el usuario indicado en \"userNCarnet\".");

        var respuesta = new Respuesta
        {
            ConvoId = convo.Id,
            UserNCarnet = userCarnet,
            Response = request.Response ?? false,
            IsCustom = request.IsCustom ?? false,
            CustomText = Normalize(request.CustomText),
            FullHorari = request.FullHorari ?? false,
            AttendanceConfirmed = request.AttendanceConfirmed ?? false,
            AttendanceJustified = request.AttendanceJustified ?? false,
            Source = "manual",
        };
        ValidateAttendance(respuesta);
        database.Respuestas.Add(respuesta);
        await database.SaveChangesAsync();
        await calculations.RecalculateResponsableAsync(convo.Id);
        await LoadAsync(respuesta);
        return Map(respuesta);
    }

    public async Task<RespuestaResponse?> UpdateAsync(int id, RespuestaRequest request, string currentCarnet, bool isAdmin)
    {
        var respuesta = await database.Respuestas.Include(item => item.Convocatoria).SingleOrDefaultAsync(item => item.Id == id);
        if (respuesta is null) return null;
        if (!isAdmin && respuesta.UserNCarnet != currentCarnet) throw new UnauthorizedAccessException();
        var canManageAttendance = isAdmin || respuesta.Convocatoria?.ResponsableId == await GetUserIdAsync(currentCarnet);
        var changesAttendance = request.AttendanceConfirmed.HasValue || request.AttendanceJustified.HasValue;
        if (changesAttendance && !canManageAttendance) throw new UnauthorizedAccessException();
        EnsureResponseWindow(respuesta.Convocatoria!, isAdmin || canManageAttendance);

        if (request.IsCustom.HasValue) respuesta.IsCustom = request.IsCustom.Value;
        if (request.CustomText is not null) respuesta.CustomText = Normalize(request.CustomText);
        if (request.FullHorari.HasValue) respuesta.FullHorari = request.FullHorari.Value;
        if (request.Response.HasValue) respuesta.Response = request.Response.Value;
        if (request.AttendanceConfirmed.HasValue) respuesta.AttendanceConfirmed = request.AttendanceConfirmed.Value;
        if (request.AttendanceJustified.HasValue) respuesta.AttendanceJustified = request.AttendanceJustified.Value;
        ValidateAttendance(respuesta);
        await database.SaveChangesAsync();
        await calculations.RecalculateResponsableAsync(respuesta.ConvoId);
        await LoadAsync(respuesta);
        return Map(respuesta);
    }

    public async Task<RespuestaResponse?> DeleteAsync(int id, string currentCarnet, bool isAdmin)
    {
        var respuesta = await database.Respuestas.Include(item => item.Convocatoria).SingleOrDefaultAsync(item => item.Id == id);
        if (respuesta is null) return null;
        if (!isAdmin && respuesta.UserNCarnet != currentCarnet) throw new UnauthorizedAccessException();
        EnsureResponseWindow(respuesta.Convocatoria!, isAdmin);
        database.Respuestas.Remove(respuesta);
        await database.SaveChangesAsync();
        await calculations.RecalculateResponsableAsync(respuesta.ConvoId);
        return Map(respuesta);
    }

    private async Task<Convocatoria> GetConvocatoriaAsync(int id) =>
        await database.Convocatorias.SingleOrDefaultAsync(item => item.Id == id)
        ?? throw new KeyNotFoundException("No se ha encontrado la convocatoria solicitada.");

    private async Task<int?> GetUserIdAsync(string carnet) =>
        await database.Users.Where(user => user.NCarnet == carnet).Select(user => (int?)user.Id).SingleOrDefaultAsync();

    private static void EnsureResponseWindow(Convocatoria convocatoria, bool privileged)
    {
        if (!privileged && convocatoria.StartTime <= DateTime.UtcNow)
            throw new InvalidOperationException("No puedes responder una convocatoria que ya ha empezado.");
    }

    private static void ValidateAttendance(Respuesta respuesta)
    {
        if (respuesta.AttendanceConfirmed && respuesta.AttendanceJustified)
            throw new ArgumentException("attendanceConfirmed y attendanceJustified no pueden ser ambos verdaderos.");
    }

    private static string ResolveCarnet(string? requested, string current, bool isAdmin)
    {
        var carnet = string.IsNullOrWhiteSpace(requested) ? current : requested.Trim();
        if (!isAdmin && carnet != current) throw new UnauthorizedAccessException();
        return carnet;
    }

    private async Task LoadAsync(Respuesta respuesta)
    {
        await database.Entry(respuesta).Reference(item => item.User).LoadAsync();
        await database.Entry(respuesta).Reference(item => item.Convocatoria).LoadAsync();
        if (respuesta.Convocatoria is not null)
            await database.Entry(respuesta.Convocatoria).Reference(item => item.ConvoType).LoadAsync();
    }

    private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static RespuestaResponse Map(Respuesta item) => new(
        item.Id, item.ConvoId,
        item.Convocatoria is null ? null : new { item.Convocatoria.Id, item.Convocatoria.Title, item.Convocatoria.StartTime, item.Convocatoria.FinalTime, convoType = item.Convocatoria.ConvoType?.Name },
        item.UserNCarnet,
        item.User is null ? null : new { item.User.Id, item.User.NCarnet, item.User.Name, item.User.LastName },
        item.IsCustom, item.CustomText, item.FullHorari, item.Response, item.AttendanceConfirmed,
        item.AttendanceJustified, item.Source, item.AutoAssignReason);
}
