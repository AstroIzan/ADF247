using System.IdentityModel.Tokens.Jwt;
using ADF247.Api.Contracts;
using ADF247.Api.Data;
using ADF247.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ADF247.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/availability/windows")]
public sealed class AvailabilityController(AvailabilityService availability, Adf247DbContext database) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] string? userNCarnet,
        [FromQuery] string? availabilityType,
        [FromQuery] DateTime? fromDateTime,
        [FromQuery] DateTime? toDateTime)
    {
        var identity = await GetIdentityAsync();
        if (identity is null) return Unauthorized();
        return Ok(await availability.GetAllAsync(identity.Value.Carnet, identity.Value.IsAdmin, userNCarnet, availabilityType, fromDateTime, toDateTime));
    }

    [HttpPost]
    public async Task<IActionResult> Create(AvailabilityWindowRequest request)
    {
        var identity = await GetIdentityAsync();
        if (identity is null) return Unauthorized();
        try
        {
            var window = await availability.CreateAsync(request, identity.Value.Carnet, identity.Value.IsAdmin);
            return StatusCode(StatusCodes.Status201Created, window);
        }
        catch (KeyNotFoundException error) { return NotFound(new { message = error.Message }); }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (ArgumentException error) { return BadRequest(new { message = error.Message }); }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, AvailabilityWindowRequest request)
    {
        var identity = await GetIdentityAsync();
        if (identity is null) return Unauthorized();
        try
        {
            var window = await availability.UpdateAsync(id, request, identity.Value.Carnet, identity.Value.IsAdmin);
            return window is null ? NotFound(new { message = "No se ha encontrado la ventana de disponibilidad solicitada." }) : Ok(window);
        }
        catch (KeyNotFoundException error) { return NotFound(new { message = error.Message }); }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (ArgumentException error) { return BadRequest(new { message = error.Message }); }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var identity = await GetIdentityAsync();
        if (identity is null) return Unauthorized();
        try
        {
            var window = await availability.DeleteAsync(id, identity.Value.Carnet, identity.Value.IsAdmin);
            return window is null ? NotFound(new { message = "No se ha encontrado la ventana de disponibilidad solicitada." }) : Ok(window);
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    private async Task<(string Carnet, bool IsAdmin)?> GetIdentityAsync()
    {
        var carnet = User.FindFirst("nCarnet")?.Value;
        if (string.IsNullOrWhiteSpace(carnet)) return null;
        var isAdmin = await database.Roles.AnyAsync(role => role.NCarnet == carnet && role.IsAdmin);
        return (carnet, isAdmin);
    }
}
