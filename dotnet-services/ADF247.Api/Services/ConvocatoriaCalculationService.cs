using ADF247.Api.Data;
using ADF247.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ADF247.Api.Services;

public sealed class ConvocatoriaCalculationService(Adf247DbContext database)
{
    public async Task ApplyAvailabilityAsync(Convocatoria convocatoria)
    {
        var systemConfiguration = await database.SystemConfigurations
            .AsNoTracking()
            .SingleOrDefaultAsync(configuration => configuration.Id == 1);
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

            var automaticResponse = AvailabilityResponsePolicy.Evaluate(convocatoria.StartTime, end, group);
            if (automaticResponse is null)
            {
                continue;
            }

            database.Respuestas.Add(new Respuesta
            {
                ConvoId = convocatoria.Id,
                UserNCarnet = group.Key,
                Response = automaticResponse.Response,
                IsCustom = automaticResponse.IsCustom,
                CustomText = automaticResponse.CustomText,
                FullHorari = automaticResponse.FullSchedule,
                AttendanceConfirmed = true,
                AttendanceJustified = false,
                Source = "auto-window",
                AutoAssignReason = automaticResponse.Reason,
            });
        }

        if (systemConfiguration?.AutoCreateUnavailableForUsersWithoutWindow == true)
        {
            var coveredCarnets = windows.Select(window => window.UserNCarnet).ToHashSet(StringComparer.OrdinalIgnoreCase);
            var usersWithoutWindow = await database.Users
                .Where(user => user.IsActive
                    && !existingCarnets.Contains(user.NCarnet)
                    && !coveredCarnets.Contains(user.NCarnet))
                .Select(user => user.NCarnet)
                .ToListAsync();

            foreach (var carnet in usersWithoutWindow)
            {
                database.Respuestas.Add(new Respuesta
                {
                    ConvoId = convocatoria.Id,
                    UserNCarnet = carnet,
                    Response = false,
                    IsCustom = false,
                    FullHorari = false,
                    AttendanceConfirmed = true,
                    AttendanceJustified = false,
                    Source = "auto-no-window",
                    AutoAssignReason = "no-availability-window",
                });
            }
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
