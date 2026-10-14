using ADF247.Api.Contracts;
using ADF247.Api.Data;
using ADF247.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ADF247.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/system-configuration")]
public sealed class SystemConfigurationController(
    SystemConfigurationService configuration,
    Adf247DbContext database) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        if (!await IsAdminAsync(cancellationToken)) return Forbid();
        return Ok(await configuration.GetAsync(cancellationToken));
    }

    [HttpPut]
    public async Task<IActionResult> Update(SystemConfigurationRequest request, CancellationToken cancellationToken)
    {
        if (!await IsAdminAsync(cancellationToken)) return Forbid();
        try { return Ok(await configuration.UpdateAsync(request, cancellationToken)); }
        catch (ArgumentException exception) { return BadRequest(new { message = exception.Message }); }
    }

    private Task<bool> IsAdminAsync(CancellationToken cancellationToken)
    {
        var carnet = User.FindFirst("nCarnet")?.Value;
        return string.IsNullOrWhiteSpace(carnet)
            ? Task.FromResult(false)
            : database.Roles.AnyAsync(role => role.NCarnet == carnet && role.IsAdmin, cancellationToken);
    }
}
