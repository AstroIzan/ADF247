using ADF247.Api.Contracts;
using ADF247.Api.Data;
using ADF247.Api.Models;
using ADF247.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ADF247.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/messaging")]
public sealed class MessagingController(MessagingService messaging, Adf247DbContext database) : ControllerBase
{
    [HttpPost("device-token")]
    public async Task<IActionResult> RegisterDevice(DeviceRegistrationRequest request, CancellationToken cancellationToken)
    {
        var carnet = GetCarnet();
        if (carnet is null) return Unauthorized();
        try
        {
            var device = await messaging.RegisterDeviceAsync(carnet, request, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, ToDeviceResponse(device));
        }
        catch (ArgumentException exception) { return BadRequest(new { message = exception.Message }); }
        catch (KeyNotFoundException exception) { return NotFound(new { message = exception.Message }); }
    }

    [HttpGet("device-tokens")]
    public async Task<IActionResult> GetCurrentDevices(CancellationToken cancellationToken)
    {
        var carnet = GetCarnet();
        if (carnet is null) return Unauthorized();
        var devices = await messaging.GetDevicesAsync(carnet, false, cancellationToken);
        return Ok(devices.Select(ToDeviceResponse));
    }

    [HttpGet("device-tokens/all")]
    public async Task<IActionResult> GetAllDevices(CancellationToken cancellationToken)
    {
        var carnet = GetCarnet();
        if (carnet is null) return Unauthorized();
        if (!await IsAdminAsync(carnet, cancellationToken)) return Forbid();
        var devices = await messaging.GetDevicesAsync(carnet, true, cancellationToken);
        return Ok(devices.Select(ToDeviceResponse));
    }

    [HttpDelete("device-token")]
    [HttpPost("device-token/deactivate")]
    public async Task<IActionResult> DeactivateDevice([FromBody] DeviceTokenRequest request, CancellationToken cancellationToken)
    {
        var carnet = GetCarnet();
        if (carnet is null) return Unauthorized();
        var device = await database.DeviceRegistrations.SingleOrDefaultAsync(candidate => candidate.Token == request.Token, cancellationToken);
        if (device is null || !string.Equals(device.NCarnet, carnet, StringComparison.Ordinal))
            return NotFound(new { message = "No se ha encontrado el dispositivo." });

        device.IsActive = false;
        device.InvalidatedAt = DateTime.UtcNow;
        device.InvalidReason = "user-deactivated";
        await database.SaveChangesAsync(cancellationToken);
        return Ok(ToDeviceResponse(device));
    }

    [HttpPost("broadcast")]
    public async Task<IActionResult> Broadcast(BroadcastNotificationRequest request, CancellationToken cancellationToken)
    {
        var carnet = GetCarnet();
        if (carnet is null) return Unauthorized();
        if (!await IsAdminAsync(carnet, cancellationToken)) return Forbid();
        try { return StatusCode(StatusCodes.Status201Created, await messaging.QueueBroadcastAsync(carnet, request, cancellationToken)); }
        catch (ArgumentException exception) { return BadRequest(new { message = exception.Message }); }
    }

    [HttpPost("dispatch/convocatoria/{convocatoriaId:int}/response-request")]
    public Task<IActionResult> DispatchResponseRequest(
        int convocatoriaId,
        ConvocatoriaNotificationRequest request,
        CancellationToken cancellationToken) =>
        DispatchConvocatoriaAsync(convocatoriaId, "response-request", request, cancellationToken);

    [HttpPost("dispatch/convocatoria/{convocatoriaId:int}/sortida-status")]
    public Task<IActionResult> DispatchSortidaStatus(
        int convocatoriaId,
        ConvocatoriaNotificationRequest request,
        CancellationToken cancellationToken) =>
        DispatchConvocatoriaAsync(convocatoriaId, "sortida-status", request, cancellationToken);

    private async Task<IActionResult> DispatchConvocatoriaAsync(
        int convocatoriaId,
        string action,
        ConvocatoriaNotificationRequest request,
        CancellationToken cancellationToken)
    {
        var carnet = GetCarnet();
        if (carnet is null) return Unauthorized();
        if (!await IsAdminAsync(carnet, cancellationToken)) return Forbid();
        try { return StatusCode(StatusCodes.Status201Created, await messaging.QueueConvocatoriaAsync(carnet, convocatoriaId, action, request, cancellationToken)); }
        catch (KeyNotFoundException exception) { return NotFound(new { message = exception.Message }); }
        catch (ArgumentException exception) { return BadRequest(new { message = exception.Message }); }
    }

    [HttpGet("logs")]
    public async Task<IActionResult> GetLogs(CancellationToken cancellationToken)
    {
        var carnet = GetCarnet();
        if (carnet is null) return Unauthorized();
        if (!await IsAdminAsync(carnet, cancellationToken)) return Forbid();
        return Ok(await messaging.GetNotificationsAsync(cancellationToken));
    }

    [HttpGet("system-status")]
    public async Task<IActionResult> GetSystemStatus(CancellationToken cancellationToken)
    {
        var carnet = GetCarnet();
        if (carnet is null) return Unauthorized();
        if (!await IsAdminAsync(carnet, cancellationToken)) return Forbid();

        var lastNotification = await database.MessagingNotifications
            .OrderByDescending(notification => notification.CreatedAt)
            .Select(notification => new
            {
                notification.Id,
                notification.Trigger,
                notification.Status,
                notification.CreatedAt,
                notification.CompletedAt,
                notification.ErrorMessage,
            })
            .FirstOrDefaultAsync(cancellationToken);
        var lastExecution = await database.TaskExecutions
            .Include(execution => execution.TaskDefinition)
            .Where(execution => execution.TaskDefinition!.Name.StartsWith("batch:"))
            .OrderByDescending(execution => execution.StartedAt)
            .Select(execution => new
            {
                execution.TaskExecutionId,
                TaskName = execution.TaskDefinition!.Name,
                execution.StartedAt,
                execution.FinishedAt,
                execution.FinalStatus,
            })
            .FirstOrDefaultAsync(cancellationToken);

        return Ok(new
        {
            database = "connected",
            activeDevices = await database.DeviceRegistrations.CountAsync(
                registration => registration.IsActive && registration.InvalidatedAt == null,
                cancellationToken),
            queuedNotifications = await database.MessagingNotifications.CountAsync(
                notification => notification.Status == "queued" || notification.Status == "processing",
                cancellationToken),
            lastNotification,
            lastExecution,
        });
    }

    [HttpGet("{notificationId:long}/deliveries")]
    public async Task<IActionResult> GetDeliveries(long notificationId, CancellationToken cancellationToken)
    {
        var carnet = GetCarnet();
        if (carnet is null) return Unauthorized();
        if (!await IsAdminAsync(carnet, cancellationToken)) return Forbid();
        var deliveries = await database.NotificationDeliveries
            .Where(delivery => delivery.NotificationId == notificationId)
            .OrderByDescending(delivery => delivery.CreatedAt)
            .ToListAsync(cancellationToken);
        return Ok(deliveries);
    }

    [HttpGet("task-definitions")]
    public async Task<IActionResult> GetTaskDefinitions(CancellationToken cancellationToken)
    {
        var carnet = GetCarnet();
        if (carnet is null) return Unauthorized();
        if (!await IsAdminAsync(carnet, cancellationToken)) return Forbid();
        var definitions = await database.TaskDefinitions
            .Where(definition => definition.Name.StartsWith("batch:"))
            .OrderBy(definition => definition.Name)
            .Select(definition => new
            {
                definition.TaskDefinitionId,
                definition.Name,
                definition.CreatedAt,
            })
            .ToListAsync(cancellationToken);
        return Ok(definitions);
    }

    [HttpGet("task-executions")]
    public async Task<IActionResult> GetTaskExecutions([FromQuery] int limit = 100, CancellationToken cancellationToken = default)
    {
        var carnet = GetCarnet();
        if (carnet is null) return Unauthorized();
        if (!await IsAdminAsync(carnet, cancellationToken)) return Forbid();
        var normalizedLimit = Math.Clamp(limit, 1, 200);
        var executions = await database.TaskExecutions
            .Include(execution => execution.TaskDefinition)
            .Where(execution => execution.TaskDefinition!.Name.StartsWith("batch:"))
            .OrderByDescending(execution => execution.StartedAt)
            .Take(normalizedLimit)
            .Select(execution => new
            {
                execution.TaskExecutionId,
                execution.TaskDefinitionId,
                TaskName = execution.TaskDefinition!.Name,
                execution.StartedAt,
                execution.FinishedAt,
                execution.LastKeepAlive,
                execution.FinalStatus,
            })
            .ToListAsync(cancellationToken);
        return Ok(executions);
    }

    [HttpGet("task-executions/{taskExecutionId:long}")]
    public async Task<IActionResult> GetTaskExecution(long taskExecutionId, CancellationToken cancellationToken)
    {
        var carnet = GetCarnet();
        if (carnet is null) return Unauthorized();
        if (!await IsAdminAsync(carnet, cancellationToken)) return Forbid();
        var execution = await database.TaskExecutions
            .Include(candidate => candidate.TaskDefinition)
            .Include(candidate => candidate.Details)
            .SingleOrDefaultAsync(candidate => candidate.TaskExecutionId == taskExecutionId
                && candidate.TaskDefinition!.Name.StartsWith("batch:"), cancellationToken);
        if (execution is null) return NotFound(new { message = "No se ha encontrado la ejecución." });
        return Ok(new
        {
            execution.TaskExecutionId,
            execution.TaskDefinitionId,
            TaskName = execution.TaskDefinition!.Name,
            execution.StartedAt,
            execution.FinishedAt,
            execution.LastKeepAlive,
            execution.FinalStatus,
            Details = execution.Details
                .OrderBy(detail => detail.OccurredAt)
                .Select(detail => new
                {
                    detail.TaskExecutionDetailId,
                    detail.EventType,
                    detail.OccurredAt,
                    detail.Message,
                    detail.DetailsJson,
                }),
        });
    }

    [HttpGet("configurations")]
    public async Task<IActionResult> GetConfigurations(CancellationToken cancellationToken)
    {
        var carnet = GetCarnet();
        if (carnet is null) return Unauthorized();
        if (!await IsAdminAsync(carnet, cancellationToken)) return Forbid();
        return Ok(await messaging.GetConfigurationsAsync(cancellationToken));
    }

    [HttpPost("configurations")]
    public async Task<IActionResult> CreateConfiguration(MessagingConfigurationRequest request, CancellationToken cancellationToken)
    {
        var carnet = GetCarnet();
        if (carnet is null) return Unauthorized();
        if (!await IsAdminAsync(carnet, cancellationToken)) return Forbid();
        try { return StatusCode(StatusCodes.Status201Created, await messaging.CreateConfigurationAsync(request, cancellationToken)); }
        catch (ArgumentException exception) { return BadRequest(new { message = exception.Message }); }
    }

    [HttpPut("configurations/{id:int}")]
    public async Task<IActionResult> UpdateConfiguration(int id, MessagingConfigurationRequest request, CancellationToken cancellationToken)
    {
        var carnet = GetCarnet();
        if (carnet is null) return Unauthorized();
        if (!await IsAdminAsync(carnet, cancellationToken)) return Forbid();
        try
        {
            var configuration = await messaging.UpdateConfigurationAsync(id, request, cancellationToken);
            return configuration is null ? NotFound(new { message = "No se ha encontrado la configuración." }) : Ok(configuration);
        }
        catch (ArgumentException exception) { return BadRequest(new { message = exception.Message }); }
    }

    private string? GetCarnet() => User.FindFirst("nCarnet")?.Value;

    private Task<bool> IsAdminAsync(string carnet, CancellationToken cancellationToken) =>
        database.Roles.AnyAsync(role => role.NCarnet == carnet && role.IsAdmin, cancellationToken);

    private static object ToDeviceResponse(DeviceRegistration device) => new
    {
        device.Id,
        device.NCarnet,
        device.Platform,
        device.IsActive,
        device.RegisteredAt,
        device.LastSeenAt,
        device.InvalidatedAt,
    };

    public sealed record DeviceTokenRequest(string Token);
}
