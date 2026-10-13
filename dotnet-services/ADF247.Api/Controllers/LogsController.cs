using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace ADF247.Api.Controllers;

[ApiController]
[Route("api/logs")]
public sealed class LogsController(IConfiguration configuration, IWebHostEnvironment environment) : ControllerBase
{
    [HttpPost("app-requests")]
    public async Task<IActionResult> AppRequest([FromBody] JsonElement body)
    {
        var route = body.TryGetProperty("route", out var routeValue) ? routeValue.GetString() : null;
        route = string.IsNullOrWhiteSpace(route) ? "/unknown" : route.Trim();
        if (!route.StartsWith('/')) route = "/" + route;
        var section = body.TryGetProperty("section", out var sectionValue) ? sectionValue.GetString() : null;
        section = string.IsNullOrWhiteSpace(section) ? route.Trim('/').Split('/').FirstOrDefault() ?? "home" : section.Trim().ToLowerInvariant();
        var path = configuration["AppRequestsLogFile"] ?? Path.Combine(environment.ContentRootPath, "logs", "app-requests.log");
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        var payload = new { timestamp = DateTime.UtcNow, route, section, source = "frontend", ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown", userAgent = Request.Headers.UserAgent.ToString(), userId = User.FindFirst("sub")?.Value, nCarnet = User.FindFirst("nCarnet")?.Value };
        await System.IO.File.AppendAllTextAsync(path, JsonSerializer.Serialize(payload) + Environment.NewLine);
        return StatusCode(StatusCodes.Status202Accepted, new { ok = true });
    }
}
