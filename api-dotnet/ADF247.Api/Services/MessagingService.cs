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
        var convocatoria = await database.Convocatorias.SingleOrDefaultAsync(item => item.Id == convocatoriaId, cancellationToken)
            ?? throw new KeyNotFoundException("No se ha encontrado la convocatoria.");
        var title = request.Title ?? "Convocatoria";
        var body = request.Body ?? convocatoria.Title;
        return await QueueAsync(carnet, convocatoriaId, trigger, title, body,
            new Dictionary<string, string> { ["convocatoriaId"] = convocatoriaId.ToString() }, cancellationToken);
    }

    public async Task<IReadOnlyList<MessagingNotification>> GetNotificationsAsync(CancellationToken cancellationToken) =>
        await database.MessagingNotifications.OrderByDescending(notification => notification.CreatedAt).Take(100).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<MessagingConfiguration>> GetConfigurationsAsync(CancellationToken cancellationToken) =>
        await database.MessagingConfigurations.OrderBy(configuration => configuration.Key).ToListAsync(cancellationToken);

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

    private async Task<MessagingNotification> QueueAsync(string carnet, int? convocatoriaId, string trigger, string title, string body, Dictionary<string, string>? data, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(body))
            throw new ArgumentException("El título y el cuerpo son obligatorios.");

        var actor = await database.Users.SingleAsync(user => user.NCarnet == carnet, cancellationToken);
        var notification = new MessagingNotification
        {
            ConvocatoriaId = convocatoriaId,
            Trigger = trigger,
            Status = "queued",
            Title = title.Trim(),
            Body = body.Trim(),
            PayloadJson = data is null ? null : JsonSerializer.Serialize(data),
            ActorUserId = actor.Id,
            CreatedAt = DateTime.UtcNow,
        };
        database.MessagingNotifications.Add(notification);
        await database.SaveChangesAsync(cancellationToken);
        return notification;
    }
}
