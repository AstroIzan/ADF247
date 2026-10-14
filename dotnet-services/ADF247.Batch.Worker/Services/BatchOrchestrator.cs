using System.Text.Json;
using ADF247.Api.Data;
using ADF247.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ADF247.Batch.Worker.Services;

public sealed class BatchOrchestrator(
    Adf247DbContext database,
    BatchTaskExecutionService taskExecutions,
    PlaAlfaLevelProvider plaAlfaLevels,
    ILogger<BatchOrchestrator> logger)
{
    private static readonly TimeZoneInfo LocalTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Europe/Madrid");

    public async Task RunDueJobsAsync(DateTimeOffset utcNow, CancellationToken cancellationToken)
    {
        var configuration = await database.SystemConfigurations
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == 1, cancellationToken);
        if (configuration is null)
        {
            logger.LogWarning("Batch worker skipped scheduling because SystemConfiguration is missing.");
            return;
        }

        var localNow = TimeZoneInfo.ConvertTime(utcNow, LocalTimeZone);
        if (localNow.DayOfWeek == (DayOfWeek)configuration.WeeklyRequestWeekday
            && localNow.Hour == configuration.WeeklyRequestHour
            && localNow.Minute == configuration.WeeklyRequestMinute)
        {
            await RunWeeklyConvosAsync(configuration, localNow, cancellationToken);
        }

        if (localNow.Hour == configuration.DailyNotificationsHour
            && localNow.Minute == configuration.DailyNotificationsMinute)
        {
            await RunDailyNotificationsAsync(localNow, cancellationToken);
        }
    }

    private async Task RunWeeklyConvosAsync(
        SystemConfiguration configuration,
        DateTimeOffset localNow,
        CancellationToken cancellationToken)
    {
        const string taskName = "batch:GenerateAndNotifyWeeklyConvos";
        var executionId = await taskExecutions.TryStartAsync(
            taskName,
            localNow,
            "GenerateAndNotifyWeeklyConvos started.",
            new { scheduledFor = localNow.ToString("O") },
            cancellationToken);
        if (!executionId.HasValue)
            return;

        try
        {
            var municipalities = await database.PlaAlfaMunicipalitySelections
                .AsNoTracking()
                .Select(item => item.Municipality)
                .ToListAsync(cancellationToken);
            if (municipalities.Count == 0)
            {
                const string message = "Pla Alfa no està configurat; no es generen convocatòries.";
                await taskExecutions.CompleteAsync(executionId.Value, "skipped", message, null, cancellationToken);
                logger.LogWarning("{BatchTask} {Message}", taskName, message);
                return;
            }

            var level = await plaAlfaLevels.GetHighestLevelAsync(municipalities, cancellationToken);
            if (!level.HasValue)
            {
                const string message = "No s'ha pogut determinar el nivell del Pla Alfa del dia en curs; no es generen convocatòries.";
                await taskExecutions.CompleteAsync(executionId.Value, "skipped", message, null, cancellationToken);
                logger.LogWarning("{BatchTask} {Message}", taskName, message);
                return;
            }

            if (level.Value == 0)
            {
                const string message = "Pla alfa del dia en curs es de nivell 0, sense risc, no es generen convocatories";
                await taskExecutions.CompleteAsync(executionId.Value, "skipped", message, new { plaAlfaLevel = level }, cancellationToken);
                logger.LogInformation("{BatchTask} {Message}", taskName, message);
                return;
            }

            var typeName = configuration.PviEnabled ? "PVI" : "Guardia";
            var convoType = await database.ConvoTypes.SingleOrDefaultAsync(
                type => type.Name == typeName,
                cancellationToken)
                ?? throw new InvalidOperationException($"No existeix el tipus de convocatòria '{typeName}'.");
            var ranges = level.Value <= 2
                ? new[] { (new TimeOnly(12, 0), new TimeOnly(16, 0)), (new TimeOnly(16, 0), new TimeOnly(20, 0)) }
                : new[] { (new TimeOnly(10, 0), new TimeOnly(14, 0)), (new TimeOnly(12, 0), new TimeOnly(16, 0)), (new TimeOnly(16, 0), new TimeOnly(21, 0)) };
            var nextMonday = GetNextMonday(DateOnly.FromDateTime(localNow.Date));
            var created = new List<Convocatoria>();

            for (var offset = 0; offset < 7; offset++)
            {
                var date = nextMonday.AddDays(offset);
                foreach (var (startTime, endTime) in ranges)
                {
                    var start = date.ToDateTime(startTime);
                    var end = date.ToDateTime(endTime);
                    var exists = await database.Convocatorias.AnyAsync(
                        item => item.ConvoTypeId == convoType.Id && item.StartTime == start,
                        cancellationToken);
                    if (exists)
                        continue;

                    var convocatoria = new Convocatoria
                    {
                        Date = date.ToDateTime(TimeOnly.MinValue),
                        Title = $"{convoType.Name} - {date:yyyy-MM-dd}",
                        UbiSortida = convoType.DefaultLocation ?? "Brigadas",
                        ConvoTypeId = convoType.Id,
                        StartTime = start,
                        FinalTime = end,
                        IsActive = true,
                        AutoAssignResponsable = false,
                        Sortida = false,
                    };
                    database.Convocatorias.Add(convocatoria);
                    created.Add(convocatoria);
                }
            }

            if (created.Count > 0)
            {
                await database.SaveChangesAsync(cancellationToken);
                foreach (var convocatoria in created)
                    await ApplyAvailabilityAsync(convocatoria, configuration, cancellationToken);
            }

            var weekEnd = nextMonday.AddDays(7).ToDateTime(TimeOnly.MinValue);
            var weekStart = nextMonday.ToDateTime(TimeOnly.MinValue);
            var pendingCarnets = await database.Users
                .Where(user => user.IsActive
                    && database.Convocatorias.Any(convocatoria =>
                        convocatoria.IsActive
                        && convocatoria.StartTime >= weekStart
                        && convocatoria.StartTime < weekEnd
                        && convocatoria.ConvoTypeId == convoType.Id
                        && !database.Respuestas.Any(response =>
                            response.ConvoId == convocatoria.Id
                            && response.UserNCarnet == user.NCarnet)))
                .Select(user => user.NCarnet)
                .ToListAsync(cancellationToken);

            var notificationId = await QueueConfigurationAsync(
                "availability-weekly",
                "weekly-response-request",
                null,
                null,
                pendingCarnets,
                cancellationToken);
            var details = new
            {
                plaAlfaLevel = level,
                convocatoriaType = typeName,
                generated = created.Count,
                pendingRecipients = pendingCarnets.Count,
                notificationId,
                nextMonday,
            };
            await taskExecutions.CompleteAsync(
                executionId.Value,
                "succeeded",
                $"Generated {created.Count} weekly convocatoria(s) and queued the weekly availability notification.",
                details,
                cancellationToken);
            logger.LogInformation(
                "GenerateAndNotifyWeeklyConvos completed. PlaAlfaLevel: {PlaAlfaLevel}. Type: {ConvoType}. Generated: {Generated}. PendingRecipients: {PendingRecipients}. NotificationId: {NotificationId}.",
                level,
                typeName,
                created.Count,
                pendingCarnets.Count,
                notificationId);
        }
        catch (Exception exception)
        {
            await taskExecutions.CompleteAsync(
                executionId.Value,
                "failed",
                $"GenerateAndNotifyWeeklyConvos failed: {exception.Message}",
                new { error = exception.Message },
                cancellationToken);
            throw;
        }
    }

    private async Task RunDailyNotificationsAsync(DateTimeOffset localNow, CancellationToken cancellationToken)
    {
        const string taskName = "batch:DailyConvoNotifications";
        var executionId = await taskExecutions.TryStartAsync(
            taskName,
            localNow,
            "DailyConvoNotifications started.",
            new { scheduledFor = localNow.ToString("O") },
            cancellationToken);
        if (!executionId.HasValue)
            return;

        try
        {
            var todayStart = DateOnly.FromDateTime(localNow.Date).ToDateTime(TimeOnly.MinValue);
            var tomorrowStart = todayStart.AddDays(1);
            var convocatorias = await database.Convocatorias
                .Include(item => item.ConvoType)
                .Include(item => item.Responsable)
                .Where(item => item.IsActive && item.StartTime >= todayStart && item.StartTime < tomorrowStart)
                .OrderBy(item => item.StartTime)
                .ToListAsync(cancellationToken);
            if (convocatorias.Count == 0)
            {
                await taskExecutions.CompleteAsync(
                    executionId.Value,
                    "skipped",
                    "No hi ha convocatòries actives per avui.",
                    null,
                    cancellationToken);
                return;
            }

            var ids = convocatorias.Select(item => item.Id).ToArray();
            var responses = await database.Respuestas
                .Where(item => ids.Contains(item.ConvoId))
                .ToListAsync(cancellationToken);
            var users = await database.Users
                .Where(item => item.IsActive)
                .Select(item => item.NCarnet)
                .ToListAsync(cancellationToken);

            var queued = 0;
            foreach (var carnet in users)
            {
                var userResponses = responses.Where(response => response.UserNCarnet == carnet).ToArray();
                var confirmed = convocatorias
                    .Where(convocatoria => convocatoria.Sortida
                        && userResponses.Any(response => response.ConvoId == convocatoria.Id
                            && (response.Response || response.IsCustom)))
                    .ToArray();
                if (confirmed.Length == 1)
                {
                    if (await QueueConvocatoriaNotificationAsync(
                        confirmed[0],
                        "sortida-status",
                        "daily-sortida-status",
                        carnet,
                        cancellationToken) is not null)
                        queued++;
                }
                else if (confirmed.Length > 1)
                {
                    if (await QueueConfigurationAsync(
                        "convocatoria-multiple-today",
                        "daily-multiple-sortida-status",
                        null,
                        null,
                        [carnet],
                        cancellationToken) is not null)
                        queued++;
                }

                var unanswered = convocatorias
                    .Where(convocatoria => userResponses.All(response => response.ConvoId != convocatoria.Id))
                    .ToArray();
                if (unanswered.Length == 1)
                {
                    if (await QueueConvocatoriaNotificationAsync(
                        unanswered[0],
                        "response-request",
                        "daily-response-request",
                        carnet,
                        cancellationToken) is not null)
                        queued++;
                }
                else if (unanswered.Length > 1)
                {
                    if (await QueueConfigurationAsync(
                        "availability-multiple-today",
                        "daily-multiple-response-request",
                        null,
                        null,
                        [carnet],
                        cancellationToken) is not null)
                        queued++;
                }
            }

            await taskExecutions.CompleteAsync(
                executionId.Value,
                "succeeded",
                $"DailyConvoNotifications completed. Queued {queued} notification(s).",
                new { convocatoriaCount = convocatorias.Count, activeUserCount = users.Count, queuedNotifications = queued },
                cancellationToken);
            logger.LogInformation(
                "DailyConvoNotifications completed. Convocatorias: {ConvocatoriaCount}. ActiveUsers: {ActiveUserCount}. QueuedNotifications: {QueuedNotifications}.",
                convocatorias.Count,
                users.Count,
                queued);
        }
        catch (Exception exception)
        {
            await taskExecutions.CompleteAsync(
                executionId.Value,
                "failed",
                $"DailyConvoNotifications failed: {exception.Message}",
                new { error = exception.Message },
                cancellationToken);
            throw;
        }
    }

    private async Task<long?> QueueConvocatoriaNotificationAsync(
        Convocatoria convocatoria,
        string kind,
        string trigger,
        string carnet,
        CancellationToken cancellationToken)
    {
        var prefix = kind == "response-request" ? "availability" : "convocatoria";
        return await QueueConfigurationAsync(
            GetConfigurationKey(prefix, convocatoria),
            trigger,
            convocatoria,
            convocatoria.Id,
            [carnet],
            cancellationToken);
    }

    private async Task<long?> QueueConfigurationAsync(
        string configurationKey,
        string trigger,
        Convocatoria? convocatoria,
        int? convocatoriaId,
        IReadOnlyCollection<string> recipientNCarnets,
        CancellationToken cancellationToken)
    {
        if (recipientNCarnets.Count == 0)
            return null;

        var configuration = await database.MessagingConfigurations.SingleOrDefaultAsync(
            item => item.Key == configurationKey && item.Enabled,
            cancellationToken);
        if (configuration is null)
        {
            logger.LogWarning(
                "Batch notification was not queued because Messaging.Configuration {ConfigurationKey} is missing or disabled.",
                configurationKey);
            return null;
        }

        var payload = new Dictionary<string, string>
        {
            ["recipientNCarnets"] = string.Join(';', recipientNCarnets),
            ["notificationTrigger"] = trigger,
            ["dispatchBehavior"] = "explicit-recipients",
        };
        if (convocatoriaId.HasValue)
            payload["convocatoriaId"] = convocatoriaId.Value.ToString();

        var notification = new MessagingNotification
        {
            ConfigurationId = configuration.Id,
            ConvocatoriaId = convocatoriaId,
            Trigger = trigger,
            Status = "queued",
            Title = RenderTemplate(configuration.TitleTemplate, convocatoria),
            Body = RenderTemplate(configuration.BodyTemplate, convocatoria),
            PayloadJson = JsonSerializer.Serialize(payload),
            RequestedCount = 0,
            SuccessCount = 0,
            FailureCount = 0,
            CreatedAt = DateTime.UtcNow,
        };
        database.MessagingNotifications.Add(notification);
        await database.SaveChangesAsync(cancellationToken);
        return notification.Id;
    }

    private async Task ApplyAvailabilityAsync(
        Convocatoria convocatoria,
        SystemConfiguration configuration,
        CancellationToken cancellationToken)
    {
        var end = convocatoria.FinalTime ?? convocatoria.StartTime.AddMinutes(1);
        var windows = await (
            from window in database.AvailabilityWindows
            join user in database.Users on window.UserNCarnet equals user.NCarnet
            where user.IsActive
                && window.FromDateTime < end
                && window.ToDateTime > convocatoria.StartTime
            select window).ToListAsync(cancellationToken);

        foreach (var group in windows.GroupBy(item => item.UserNCarnet))
        {
            var hasAvailable = group.Any(item => item.AvailabilityType == "available");
            var hasUnavailable = group.Any(item => item.AvailabilityType == "unavailable");
            var response = hasUnavailable ? false : hasAvailable ? true : (bool?)null;
            if (!response.HasValue)
                continue;

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
                AutoAssignReason = response.Value ? "available-window-match" : "unavailable-window-match",
            });
        }

        if (configuration.AutoCreateUnavailableForUsersWithoutWindow)
        {
            var coveredCarnets = windows.Select(item => item.UserNCarnet).ToHashSet(StringComparer.OrdinalIgnoreCase);
            var usersWithoutWindow = await database.Users
                .Where(user => user.IsActive && !coveredCarnets.Contains(user.NCarnet))
                .Select(user => user.NCarnet)
                .ToListAsync(cancellationToken);
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

        await database.SaveChangesAsync(cancellationToken);
    }

    private static string GetConfigurationKey(string prefix, Convocatoria convocatoria)
    {
        var name = convocatoria.ConvoType?.Name ?? string.Empty;
        if (name.Contains("incendi", StringComparison.OrdinalIgnoreCase))
            return $"{prefix}-fire";
        if (name.Contains("setman", StringComparison.OrdinalIgnoreCase)
            || name.Contains("guardia", StringComparison.OrdinalIgnoreCase)
            || name.Contains("pvi", StringComparison.OrdinalIgnoreCase))
            return $"{prefix}-weekly";
        return $"{prefix}-today";
    }

    private static string RenderTemplate(string template, Convocatoria? convocatoria)
    {
        if (convocatoria is null)
            return template;

        var responsable = convocatoria.Responsable is null
            ? string.Empty
            : $"{convocatoria.Responsable.NCarnet} {convocatoria.Responsable.Name} {convocatoria.Responsable.LastName}".Trim();
        var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["convocatoria.title"] = convocatoria.Title,
            ["convocatoria.date"] = convocatoria.Date.ToString("dd/MM/yyyy"),
            ["convocatoria.startTime"] = convocatoria.StartTime.ToString("HH:mm"),
            ["convocatoria.endTime"] = convocatoria.FinalTime?.ToString("HH:mm") ?? string.Empty,
            ["convocatoria.location"] = convocatoria.UbiSortida,
            ["convocatoria.responsable"] = responsable,
            ["response.deadline"] = convocatoria.StartTime.ToString("dd/MM/yyyy HH:mm"),
            ["fire.location"] = convocatoria.UbiSortida,
        };
        foreach (var (key, value) in values)
            template = template.Replace($"{{{{{key}}}}}", value, StringComparison.OrdinalIgnoreCase);
        return template;
    }

    private static DateOnly GetNextMonday(DateOnly date)
    {
        var daysUntilMonday = ((int)DayOfWeek.Monday - (int)date.DayOfWeek + 7) % 7;
        return date.AddDays(daysUntilMonday == 0 ? 7 : daysUntilMonday);
    }
}
