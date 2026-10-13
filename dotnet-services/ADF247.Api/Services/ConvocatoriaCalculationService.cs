using ADF247.Api.Data;
using ADF247.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ADF247.Api.Services;

public sealed class ConvocatoriaCalculationService(Adf247DbContext database)
{
    public async Task ApplyAvailabilityAsync(Convocatoria convocatoria)
    {
        var end = convocatoria.FinalTime ?? convocatoria.StartTime.AddMinutes(1);
        var windows = await database.AvailabilityWindows
            .Where(window => window.FromDateTime < end
                && window.ToDateTime > convocatoria.StartTime
                && window.User!.IsActive)
            .ToListAsync();

        var existingCarnets = await database.Respuestas
            .Where(response => response.ConvoId == convocatoria.Id)
            .Select(response => response.UserNCarnet)
            .ToHashSetAsync();

        foreach (var group in windows.GroupBy(window => window.UserNCarnet))
        {
            if (existingCarnets.Contains(group.Key))
            {
                continue;
            }

            var hasAvailable = group.Any(window => window.AvailabilityType == "available");
            var hasUnavailable = group.Any(window => window.AvailabilityType == "unavailable");
            var response = hasUnavailable ? false : hasAvailable ? true : (bool?)null;
            if (!response.HasValue)
            {
                continue;
            }

            database.Respuestas.Add(new Respuesta
            {
                ConvoId = convocatoria.Id,
                UserNCarnet = group.Key,
                Response = response.Value,
                IsCustom = false,
                FullHorari = response.Value,
                AttendanceConfirmed = true,
                AttendanceJustified = false,
                Source = "auto-window",
                AutoAssignReason = response.Value
                    ? "available-window-match"
                    : "unavailable-window-match",
            });
        }

        await database.SaveChangesAsync();
        await RecalculateResponsableAsync(convocatoria.Id);
    }

    public async Task RecalculateResponsableAsync(int convocatoriaId)
    {
        var convocatoria = await database.Convocatorias
            .SingleOrDefaultAsync(item => item.Id == convocatoriaId);
        if (convocatoria is null || !convocatoria.AutoAssignResponsable)
        {
            return;
        }

        var candidates = await database.Respuestas
            .Where(response => response.ConvoId == convocatoriaId && response.Response && response.User!.IsActive)
            .Include(response => response.User!)
                .ThenInclude(user => user.Roles)
            .Select(response => response.User!)
            .ToListAsync();

        var selected = candidates
            .OrderBy(GetPriority)
            .ThenBy(user => user.CreatedAt)
            .FirstOrDefault();

        if (convocatoria.ResponsableId != selected?.Id)
        {
            convocatoria.ResponsableId = selected?.Id;
            await database.SaveChangesAsync();
        }
    }

    private static int GetPriority(User user)
    {
        var role = user.Roles.FirstOrDefault();
        if (role?.IsCapOperatiu == true) return 0;
        if (role?.IsCapColla == true) return 1;
        return role?.IsGroc == true ? 2 : 3;
    }
}
