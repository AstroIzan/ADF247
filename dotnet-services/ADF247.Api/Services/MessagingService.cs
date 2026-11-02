using System.Text.Json;
using ADF247.Api.Contracts;
using ADF247.Api.Data;
using ADF247.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ADF247.Api.Services;

public sealed class MessagingService(Adf247DbContext database)
{
    public async Task<DeviceRegistration> RegisterDeviceAsync(string carnet, DeviceRegistrationRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.Platform))
            throw new ArgumentException("El token y la plataforma son obligatorios.");

        var user = await database.Users.SingleOrDefaultAsync(candidate => candidate.NCarnet == carnet, cancellationToken)
            ?? throw new KeyNotFoundException("No se ha encontrado el usuario autenticado.");
        var now = DateTime.UtcNow;
        var registration = await database.DeviceRegistrations.SingleOrDefaultAsync(candidate => candidate.Token == request.Token, cancellationToken);

        if (registration is null)
        {
            registration = new DeviceRegistration
            {
                UserId = user.Id,
                NCarnet = user.NCarnet,
                Token = request.Token,
                Platform = request.Platform,
                UserAgent = request.UserAgent,
                IsActive = true,
                RegisteredAt = now,
                LastSeenAt = now,
            };
            database.DeviceRegistrations.Add(registration);
        }
        else
        {
            registration.UserId = user.Id;
            registration.NCarnet = user.NCarnet;
            registration.Platform = request.Platform;
            registration.UserAgent = request.UserAgent;
            registration.IsActive = true;
            registration.InvalidatedAt = null;
            registration.InvalidReason = null;
            registration.LastSeenAt = now;
        }

        await database.SaveChangesAsync(cancellationToken);
        return registration;
    }

    public async Task<IReadOnlyList<DeviceRegistration>> GetDevicesAsync(string carnet, bool all, CancellationToken cancellationToken) =>
        await database.DeviceRegistrations
            .Where(device => all || device.NCarnet == carnet)
            .OrderByDescending(device => device.LastSeenAt)
            .ToListAsync(cancellationToken);

    public async Task<MessagingNotification> QueueBroadcastAsync(string carnet, BroadcastNotificationRequest request, CancellationToken cancellationToken) =>
        await QueueAsync(carnet, null, "on-demand", request.Title, request.Body, request.Data, cancellationToken);

    public async Task<MessagingNotification> QueueConvocatoriaAsync(string carnet, int convocatoriaId, string trigger, ConvocatoriaNotificationRequest request, CancellationToken cancellationToken)
    {
        var convocatoria = await database.Convocatorias
            .Include(item => item.ConvoType)
            .Include(item => item.Responsable)
            .SingleOrDefaultAsync(item => item.Id == convocatoriaId, cancellationToken)
            ?? throw new KeyNotFoundException("No se ha encontrado la convocatoria.");

        if (trigger is "response-request" or "sortida-status")
        {
            if (convocatoria.ActualStartTime.HasValue || convocatoria.ActualEndTime.HasValue)
                throw new ArgumentException("La convocatoria ya se ha iniciado: solo se pueden enviar avisos de inicio y final de servei.");
            if (!convocatoria.IsActive || convocatoria.FinalTime.HasValue && convocatoria.FinalTime.Value < GetBarcelonaNow())
                throw new ArgumentException("La convocatoria ya ha finalizado: no se pueden enviar notificaciones.");
        }

        var configuration = await FindConvocatoriaConfigurationAsync(convocatoria, trigger, cancellationToken);
        var title = request.Title ?? RenderTemplate(
            configuration?.TitleTemplate ?? (trigger == "sortida-status" ? "Confirmació de sortida" : "Convocatòria"),
            convocatoria);
        var body = request.Body ?? RenderTemplate(
            configuration?.BodyTemplate ?? DefaultBody(trigger, convocatoria),
            convocatoria);
        return await QueueAsync(carnet, convocatoriaId, trigger, title, body,
            new Dictionary<string, string> { ["convocatoriaId"] = convocatoriaId.ToString() }, cancellationToken, configuration?.Id);
    }

    public async Task<MessagingNotification> QueueServiceLifecycleAsync(
        string carnet,
        int convocatoriaId,
        string serviceMoment,
        IReadOnlyCollection<string> vehicleNames,
        int volunteerCount,
        string? finalObservations,
        CancellationToken cancellationToken)
    {
        var convocatoria = await database.Convocatorias
            .Include(item => item.Responsable)
            .SingleOrDefaultAsync(item => item.Id == convocatoriaId, cancellationToken)
            ?? throw new KeyNotFoundException("No se ha encontrado la convocatoria.");

        var respondingUsers = await (
            from response in database.Respuestas
            join role in database.Roles on response.UserNCarnet equals role.NCarnet into roles
            from role in roles.DefaultIfEmpty()
            where response.ConvoId == convocatoriaId && response.Response
            select role != null && role.IsGroc)
            .ToListAsync(cancellationToken);
        var grocs = respondingUsers.Count(isGroc => isGroc);
        var noGrocs = respondingUsers.Count - grocs;
        var vehicles = vehicleNames.Count == 0
            ? "Sense vehicles"
            : string.Join(", ", vehicleNames);

        if (serviceMoment == "START")
        {
            var responsable = convocatoria.Responsable is null
                ? "Sense responsable assignat"
                : $"{convocatoria.Responsable.NCarnet} {convocatoria.Responsable.Name} {convocatoria.Responsable.LastName}".Trim();
            var startTemplate = await FindServiceConfigurationAsync("service-start", cancellationToken);
            var startValues = new Dictionary<string, string>
            {
                ["service.time"] = convocatoria.StartTime.ToString("HH:mm"),
                ["service.grocs"] = grocs.ToString(),
                ["service.noGrocs"] = noGrocs.ToString(),
                ["service.vehicles"] = vehicles,
                ["service.responsable"] = responsable,
            };
            return await QueueAsync(
                carnet,
                convocatoriaId,
                "service-start",
                RenderServiceTemplate(startTemplate.TitleTemplate, startValues, convocatoria),
                RenderServiceTemplate(startTemplate.BodyTemplate, startValues, convocatoria),
                new Dictionary<string, string> { ["convocatoriaId"] = convocatoriaId.ToString() },
                cancellationToken);
        }

        if (serviceMoment == "END")
        {
            var localNow = GetBarcelonaNow();
            var summary = string.IsNullOrWhiteSpace(finalObservations)
                ? $"Resum del formulari: {(volunteerCount == 1 ? "1 voluntari" : $"{volunteerCount} voluntaris")} · Vehicles: {vehicles}"
                : finalObservations.Trim();
            var finishTemplate = await FindServiceConfigurationAsync("service-finish", cancellationToken);
            var finishValues = new Dictionary<string, string>
            {
                ["service.time"] = localNow.ToString("HH:mm"),
                ["service.summary"] = summary,
                ["service.vehicles"] = vehicles,
                ["service.volunteers"] = volunteerCount.ToString(),
            };
            return await QueueAsync(
                carnet,
                convocatoriaId,
                "service-finish",
                RenderServiceTemplate(finishTemplate.TitleTemplate, finishValues, convocatoria),
                RenderServiceTemplate(finishTemplate.BodyTemplate, finishValues, convocatoria),
                new Dictionary<string, string> { ["convocatoriaId"] = convocatoriaId.ToString() },
                cancellationToken);
        }

        throw new ArgumentException("El moment de servei ha de ser START o END.");
    }

    public async Task<IReadOnlyList<MessagingNotification>> GetNotificationsAsync(CancellationToken cancellationToken) =>
        await database.MessagingNotifications.OrderByDescending(notification => notification.CreatedAt).Take(100).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<MessagingConfiguration>> GetConfigurationsAsync(CancellationToken cancellationToken)
    {
        await EnsureServiceConfigurationsAsync(cancellationToken);
        return await database.MessagingConfigurations.OrderBy(configuration => configuration.Key).ToListAsync(cancellationToken);
    }

    private static readonly (string Key, string Name, string Title, string Body, string Timing)[] ServiceDefaults =
    [
        ("service-start", "Inici de servei", "Sabadell inicia servei",
            "Inici de servei a les {{service.time}}, {{service.grocs}}🟡 + {{service.noGrocs}}🟢 + {{service.vehicles}}\nComunicacions {{service.responsable}}", "service-start"),
        ("service-finish", "Fi de servei", "Sabadell finalitza servei",
            "Fi de servei a les {{service.time}}.\n{{service.summary}}\nMoltes gracies!", "service-finish"),
    ];

    private async Task EnsureServiceConfigurationsAsync(CancellationToken cancellationToken)
    {
        var existing = await database.MessagingConfigurations.Select(configuration => configuration.Key).ToListAsync(cancellationToken);
        var added = false;
        foreach (var item in ServiceDefaults.Where(item => !existing.Contains(item.Key)))
        {
            var now = DateTime.UtcNow;
            database.MessagingConfigurations.Add(new MessagingConfiguration
            {
                Key = item.Key,
                Name = item.Name,
                TitleTemplate = item.Title,
                BodyTemplate = item.Body,
                AudienceRuleJson = $"{{\"messageKind\":\"service\",\"timing\":\"{item.Timing}\",\"recipientSelector\":{{\"response\":\"yes\",\"roles\":{{\"include\":[],\"exclude\":[]}}}}}}",
                Enabled = true,
                CreatedAt = now,
                UpdatedAt = now,
            });
            added = true;
        }
        if (added) await database.SaveChangesAsync(cancellationToken);
    }

    private async Task<(string TitleTemplate, string BodyTemplate)> FindServiceConfigurationAsync(string key, CancellationToken cancellationToken)
    {
        await EnsureServiceConfigurationsAsync(cancellationToken);
        var configuration = await database.MessagingConfigurations.AsNoTracking()
            .SingleOrDefaultAsync(item => item.Key == key && item.Enabled, cancellationToken);
        if (configuration is not null) return (configuration.TitleTemplate, configuration.BodyTemplate);
        var fallback = ServiceDefaults.First(item => item.Key == key);
        return (fallback.Title, fallback.Body);
    }

    private static string RenderServiceTemplate(string template, Dictionary<string, string> values, Convocatoria convocatoria)
    {
        foreach (var (key, value) in values)
            template = template.Replace($"{{{{{key}}}}}", value, StringComparison.OrdinalIgnoreCase);
        return RenderTemplate(template, convocatoria);
    }

    public async Task<MessagingConfiguration> CreateConfigurationAsync(MessagingConfigurationRequest request, CancellationToken cancellationToken)
    {
        ValidateConfiguration(request);
        if (await database.MessagingConfigurations.AnyAsync(configuration => configuration.Key == request.Key, cancellationToken))
            throw new ArgumentException("Ya existe una configuración con esta clave.");

        var now = DateTime.UtcNow;
        var configuration = new MessagingConfiguration
        {
            Key = request.Key.Trim(),
            Name = request.Name.Trim(),
            TitleTemplate = request.TitleTemplate.Trim(),
            BodyTemplate = request.BodyTemplate.Trim(),
            AudienceRuleJson = request.AudienceRuleJson,
            Enabled = request.Enabled,
            CreatedAt = now,
            UpdatedAt = now,
        };
        database.MessagingConfigurations.Add(configuration);
        await database.SaveChangesAsync(cancellationToken);
        return configuration;
    }

    public async Task<MessagingConfiguration?> UpdateConfigurationAsync(int id, MessagingConfigurationRequest request, CancellationToken cancellationToken)
    {
        ValidateConfiguration(request);
        var configuration = await database.MessagingConfigurations.SingleOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
        if (configuration is null) return null;
        if (await database.MessagingConfigurations.AnyAsync(candidate => candidate.Id != id && candidate.Key == request.Key, cancellationToken))
            throw new ArgumentException("Ya existe una configuración con esta clave.");

        configuration.Key = request.Key.Trim();
        configuration.Name = request.Name.Trim();
        configuration.TitleTemplate = request.TitleTemplate.Trim();
        configuration.BodyTemplate = request.BodyTemplate.Trim();
        configuration.AudienceRuleJson = request.AudienceRuleJson;
        configuration.Enabled = request.Enabled;
        configuration.UpdatedAt = DateTime.UtcNow;
        await database.SaveChangesAsync(cancellationToken);
        return configuration;
    }

    private static void ValidateConfiguration(MessagingConfigurationRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Key) || string.IsNullOrWhiteSpace(request.Name)
            || string.IsNullOrWhiteSpace(request.TitleTemplate) || string.IsNullOrWhiteSpace(request.BodyTemplate)
            || string.IsNullOrWhiteSpace(request.AudienceRuleJson))
            throw new ArgumentException("La clave, el nombre, las plantillas y la regla de audiencia son obligatorios.");

        try { JsonDocument.Parse(request.AudienceRuleJson); }
        catch (JsonException) { throw new ArgumentException("La regla de audiencia debe ser JSON válido."); }
    }

    private async Task<MessagingNotification> QueueAsync(string carnet, int? convocatoriaId, string trigger, string title, string body, Dictionary<string, string>? data, CancellationToken cancellationToken, int? configurationId = null)
    {
        if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(body))
            throw new ArgumentException("El título y el cuerpo son obligatorios.");

        var actor = await database.Users.SingleAsync(user => user.NCarnet == carnet, cancellationToken);
        var notification = new MessagingNotification
        {
            ConfigurationId = configurationId,
            ConvocatoriaId = convocatoriaId,
            Trigger = trigger,
            Status = "queued",
            Title = title.Trim(),
            Body = body.Trim(),
            PayloadJson = JsonSerializer.Serialize(new Dictionary<string, string>(data ?? new()) { ["adfId"] = actor.AdfId.ToString() }),
            ActorUserId = actor.Id,
            CreatedAt = DateTime.UtcNow,
        };
        database.MessagingNotifications.Add(notification);
        await database.SaveChangesAsync(cancellationToken);
        return notification;
    }

    private async Task<MessagingConfiguration?> FindConvocatoriaConfigurationAsync(
        Convocatoria convocatoria,
        string trigger,
        CancellationToken cancellationToken)
    {
        var key = GetConvocatoriaConfigurationKey(convocatoria, trigger);
        return await database.MessagingConfigurations
            .SingleOrDefaultAsync(configuration => configuration.Key == key && configuration.Enabled, cancellationToken);
    }

    private static string GetConvocatoriaConfigurationKey(Convocatoria convocatoria, string trigger)
    {
        var prefix = trigger == "response-request" ? "availability" : "convocatoria";

        if (convocatoria.ConvoType?.Name.Contains("incendi", StringComparison.OrdinalIgnoreCase) == true)
            return $"{prefix}-fire";
        if (convocatoria.ConvoType?.Name.Contains("setman", StringComparison.OrdinalIgnoreCase) == true
            || convocatoria.ConvoType?.Name.Contains("guardia", StringComparison.OrdinalIgnoreCase) == true
            || convocatoria.ConvoType?.Name.Contains("pvi", StringComparison.OrdinalIgnoreCase) == true)
            return $"{prefix}-weekly";

        var date = DateOnly.FromDateTime(convocatoria.Date);
        var barcelonaNow = GetBarcelonaNow();
        var today = DateOnly.FromDateTime(barcelonaNow);
        if (date < today || date == today && convocatoria.StartTime <= barcelonaNow)
            return $"{prefix}-now";
        return date == today ? $"{prefix}-today"
            : date == today.AddDays(1) ? $"{prefix}-tomorrow"
            : $"{prefix}-future";
    }

    private static string DefaultBody(string trigger, Convocatoria convocatoria) =>
        trigger == "sortida-status"
            ? $"La sortida de la convocatòria \"{convocatoria.Title}\" ha estat confirmada."
            : $"{convocatoria.Title}\n{convocatoria.Date:dd/MM/yyyy} de {convocatoria.StartTime:HH:mm} a {convocatoria.FinalTime:HH:mm}\n{convocatoria.UbiSortida}";

    private static string RenderTemplate(string template, Convocatoria convocatoria)
    {
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
            ["response.deadline"] = FormatResponseWindow(convocatoria),
            ["fire.location"] = convocatoria.UbiSortida,
        };
        foreach (var (key, value) in values)
            template = template.Replace($"{{{{{key}}}}}", value, StringComparison.OrdinalIgnoreCase);
        return template;
    }

    private static string FormatResponseWindow(Convocatoria convocatoria) =>
        convocatoria.ResponseWindowMinutes is > 0
            ? $"{convocatoria.ResponseWindowMinutes} minuts"
            : convocatoria.StartTime.ToString("dd/MM/yyyy HH:mm");

    private static DateTime GetBarcelonaNow()
    {
        var timeZone = TryGetTimeZone("Europe/Madrid") ?? TryGetTimeZone("Romance Standard Time") ?? TimeZoneInfo.Utc;
        return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZone);
    }

    private static TimeZoneInfo? TryGetTimeZone(string id)
    {
        try { return TimeZoneInfo.FindSystemTimeZoneById(id); }
        catch (TimeZoneNotFoundException) { return null; }
        catch (InvalidTimeZoneException) { return null; }
    }
}
