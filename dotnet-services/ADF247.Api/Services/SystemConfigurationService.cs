using System.Text.Json;
using ADF247.Api.Contracts;
using ADF247.Api.Data;
using ADF247.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ADF247.Api.Services;

public sealed class SystemConfigurationService(Adf247DbContext database)
{
    public async Task<object> GetAsync(CancellationToken cancellationToken) =>
        ToResponse(await GetEntityAsync(cancellationToken));

    public async Task<object> UpdateAsync(SystemConfigurationRequest request, CancellationToken cancellationToken)
    {
        Validate(request);
        var weeklyTypeIds = request.WeeklyConvoTypeIds?.Distinct().Order().ToArray() ?? [];
        var campaignHoursTypeIds = request.CampaignHoursConvoTypeIds?.Distinct().Order().ToArray() ?? [];
        var weeklySchedules = Array.Empty<WeeklyConvocatoriaScheduleRequest>();
        var selectedTypeIds = weeklyTypeIds.Concat(campaignHoursTypeIds).Distinct().ToArray();
        if (selectedTypeIds.Length > 0)
        {
            var knownTypeCount = await database.ConvoTypes.CountAsync(type => selectedTypeIds.Contains(type.Id), cancellationToken);
            if (knownTypeCount != selectedTypeIds.Length)
                throw new ArgumentException("Hi ha tipus de convocatòria que no existeixen.");
        }

        var managers = request.AvailabilityManagerNCarnets?
            .Select(carnet => carnet.Trim())
            .Where(carnet => carnet.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Order(StringComparer.OrdinalIgnoreCase)
            .ToArray() ?? [];
        if (managers.Length > 0)
        {
            var adminCount = await database.Roles
                .Where(role => role.IsAdmin && managers.Contains(role.NCarnet))
                .Select(role => role.NCarnet)
                .Distinct()
                .CountAsync(cancellationToken);
            if (adminCount != managers.Length)
                throw new ArgumentException("Els responsables de disponibilitat han de ser administradors existents.");
        }

        var vehicles = NormalizeVehicles(request.VehicleCatalog);
        var configuration = await GetEntityAsync(cancellationToken);
        configuration.AutoCreateUnavailableForUsersWithoutWindow = request.AutoCreateUnavailableForUsersWithoutWindow;
        configuration.NotifyOnAutoAvailableResponse = request.NotifyOnAutoAvailableResponse;
        configuration.PviEnabled = request.PviEnabled;
        configuration.WeeklyConvoTypeIdsJson = JsonSerializer.Serialize(weeklyTypeIds);
        configuration.CampaignHoursConvoTypeIdsJson = JsonSerializer.Serialize(campaignHoursTypeIds);
        configuration.WeeklyConvocatoriaSchedulesJson = JsonSerializer.Serialize(weeklySchedules);
        configuration.WeeklyRequestWeekday = request.WeeklyRequestWeekday;
        configuration.WeeklyRequestHour = request.WeeklyRequestHour;
        configuration.WeeklyRequestMinute = request.WeeklyRequestMinute;
        configuration.AvailabilityManagerNCarnetsJson = JsonSerializer.Serialize(managers);
        configuration.DailyNotificationsHour = request.DailyNotificationsHour;
        configuration.DailyNotificationsMinute = request.DailyNotificationsMinute;
        configuration.CampaignStartDate = request.CampaignStartDate;
        configuration.CampaignEndDate = request.CampaignEndDate;
        configuration.UnansweredPenaltyThreshold = request.UnansweredPenaltyThreshold;
        configuration.UnansweredPenaltyHours = request.UnansweredPenaltyHours;
        configuration.NoShowPenaltyHours = request.NoShowPenaltyHours;
        configuration.VehicleCatalogJson = JsonSerializer.Serialize(vehicles);
        configuration.UpdatedAt = DateTime.UtcNow;
        await database.SaveChangesAsync(cancellationToken);
        return ToResponse(configuration);
    }

    private async Task<SystemConfiguration> GetEntityAsync(CancellationToken cancellationToken)
    {
        var configuration = await database.SystemConfigurations.SingleOrDefaultAsync(item => item.Id == 1, cancellationToken);
        if (configuration is not null) return configuration;

        configuration = Defaults();
        database.SystemConfigurations.Add(configuration);
        await database.SaveChangesAsync(cancellationToken);
        return configuration;
    }

    private static SystemConfiguration Defaults() => new()
    {
        Id = 1,
        WeeklyConvoTypeIdsJson = "[]",
        CampaignHoursConvoTypeIdsJson = "[]",
        WeeklyConvocatoriaSchedulesJson = "[]",
        AvailabilityManagerNCarnetsJson = "[]",
        VehicleCatalogJson = "[]",
        WeeklyRequestWeekday = 5,
        WeeklyRequestHour = 8,
        WeeklyRequestMinute = 0,
        DailyNotificationsHour = 8,
        DailyNotificationsMinute = 0,
        UnansweredPenaltyHours = 1,
        NoShowPenaltyHours = 4,
        UpdatedAt = DateTime.UtcNow,
    };

    private static object ToResponse(SystemConfiguration configuration) => new
    {
        configuration.AutoCreateUnavailableForUsersWithoutWindow,
        configuration.NotifyOnAutoAvailableResponse,
        configuration.PviEnabled,
        WeeklyConvoTypeIds = Deserialize<int>(configuration.WeeklyConvoTypeIdsJson),
        CampaignHoursConvoTypeIds = Deserialize<int>(configuration.CampaignHoursConvoTypeIdsJson),
        WeeklyConvocatoriaSchedules = Deserialize<WeeklyConvocatoriaScheduleRequest>(configuration.WeeklyConvocatoriaSchedulesJson),
        configuration.WeeklyRequestWeekday,
        configuration.WeeklyRequestHour,
        configuration.WeeklyRequestMinute,
        AvailabilityManagerNCarnets = Deserialize<string>(configuration.AvailabilityManagerNCarnetsJson),
        configuration.DailyNotificationsHour,
        configuration.DailyNotificationsMinute,
        configuration.CampaignStartDate,
        configuration.CampaignEndDate,
        configuration.UnansweredPenaltyThreshold,
        configuration.UnansweredPenaltyHours,
        configuration.NoShowPenaltyHours,
        VehicleCatalog = Deserialize<CampaignVehicleRequest>(configuration.VehicleCatalogJson),
        configuration.UpdatedAt,
    };

    private static T[] Deserialize<T>(string json)
    {
        try { return JsonSerializer.Deserialize<T[]>(json) ?? []; }
        catch (JsonException) { return []; }
    }

    private static CampaignVehicleRequest[] NormalizeVehicles(IReadOnlyList<CampaignVehicleRequest>? vehicles) =>
        (vehicles ?? [])
            .Select(vehicle => new CampaignVehicleRequest(vehicle.Indicatiu.Trim(), vehicle.Modelo?.Trim(), vehicle.Litres, vehicle.Kms))
            .Where(vehicle => vehicle.Indicatiu.Length > 0)
            .GroupBy(vehicle => vehicle.Indicatiu, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First())
            .OrderBy(vehicle => vehicle.Indicatiu, StringComparer.OrdinalIgnoreCase)
            .ToArray();

    private static void Validate(SystemConfigurationRequest request)
    {
        if (request.WeeklyRequestWeekday is < 0 or > 6
            || request.WeeklyRequestHour is < 0 or > 23
            || request.WeeklyRequestMinute is < 0 or > 59
            || request.DailyNotificationsHour is < 0 or > 23
            || request.DailyNotificationsMinute is < 0 or > 59
            || request.UnansweredPenaltyThreshold is < 0 or > 365
            || request.UnansweredPenaltyHours is < 0 or > 24
            || request.NoShowPenaltyHours is < 0 or > 24
            || (request.CampaignStartDate.HasValue
                && request.CampaignEndDate.HasValue
                && request.CampaignEndDate.Value < request.CampaignStartDate.Value)
            || (request.VehicleCatalog ?? []).Any(vehicle => vehicle.Kms < 0 || vehicle.Litres < 0))
            throw new ArgumentException("La configuració del sistema conté valors no vàlids.");
    }
}
