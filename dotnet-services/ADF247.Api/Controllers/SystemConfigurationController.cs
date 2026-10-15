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

    [HttpGet("developer/pla-alfa-simulation")]
    public async Task<IActionResult> GetPlaAlfaSimulation(CancellationToken cancellationToken)
    {
        if (!await IsDeveloperAsync(cancellationToken)) return Forbid();
        var principal = await database.PlaAlfaMunicipalitySelections
            .AsNoTracking()
            .SingleOrDefaultAsync(selection => selection.IsPrincipal, cancellationToken);
        return Ok(new
        {
            principalMunicipality = principal?.Municipality,
            todayLevel = principal?.SimulationTodayLevel,
            tomorrowLevel = principal?.SimulationTomorrowLevel,
        });
    }

    [HttpPut("developer/pla-alfa-simulation")]
    public async Task<IActionResult> UpdatePlaAlfaSimulation(PlaAlfaSimulationRequest request, CancellationToken cancellationToken)
    {
        if (!await IsDeveloperAsync(cancellationToken)) return Forbid();
        if (request.TodayLevel is < 0 or > 5 || request.TomorrowLevel is < 0 or > 5)
            return BadRequest(new { message = "Els nivells simulats de Pla Alfa han d'estar entre 0 i 5." });

        var principal = await database.PlaAlfaMunicipalitySelections
            .SingleOrDefaultAsync(selection => selection.IsPrincipal, cancellationToken);
        if (principal is null)
            return BadRequest(new { message = "Cal marcar un municipi com a principal a Pla Alfa abans de configurar la simulació." });

        principal.SimulationTodayLevel = request.TodayLevel;
        principal.SimulationTomorrowLevel = request.TomorrowLevel;
        principal.UpdatedAt = DateTime.UtcNow;
        await database.SaveChangesAsync(cancellationToken);
        return Ok(new
        {
            principalMunicipality = principal.Municipality,
            todayLevel = principal.SimulationTodayLevel,
            tomorrowLevel = principal.SimulationTomorrowLevel,
        });
    }

    private Task<bool> IsAdminAsync(CancellationToken cancellationToken)
    {
        var carnet = User.FindFirst("nCarnet")?.Value;
        return string.IsNullOrWhiteSpace(carnet)
            ? Task.FromResult(false)
            : database.Roles.AnyAsync(role => role.NCarnet == carnet && role.IsAdmin, cancellationToken);
    }

    private Task<bool> IsDeveloperAsync(CancellationToken cancellationToken)
    {
        var carnet = User.FindFirst("nCarnet")?.Value;
        return string.IsNullOrWhiteSpace(carnet)
            ? Task.FromResult(false)
            : database.Roles.AnyAsync(role => role.NCarnet == carnet && role.IsDeveloper, cancellationToken);
    }
}
