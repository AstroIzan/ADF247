using ADF247.Api.Contracts;
using ADF247.Api.Data;
using ADF247.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ADF247.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/dispo")]
public sealed class DispoController(RespuestaService respuestas, Adf247DbContext database) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] int? convoId, [FromQuery] string? userNCarnet)
    {
        var identity = await GetIdentityAsync();
        return identity is null ? Unauthorized() : Ok(await respuestas.GetAllAsync(identity.Value.Carnet, identity.Value.IsAdmin, convoId, userNCarnet));
    }

    [HttpPost]
    public async Task<IActionResult> Create(RespuestaRequest request)
    {
        var identity = await GetIdentityAsync();
        if (identity is null) return Unauthorized();
        try
        {
            return StatusCode(StatusCodes.Status201Created, await respuestas.CreateAsync(request, identity.Value.Carnet, identity.Value.IsAdmin));
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (KeyNotFoundException error) { return NotFound(new { message = error.Message }); }
        catch (InvalidOperationException error) { return Conflict(new { message = error.Message }); }
        catch (ArgumentException error) { return BadRequest(new { message = error.Message }); }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, RespuestaRequest request)
    {
        var identity = await GetIdentityAsync();
        return identity is null ? Unauthorized() : await ExecuteAsync(() => respuestas.UpdateAsync(id, request, identity.Value.Carnet, identity.Value.IsAdmin));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var identity = await GetIdentityAsync();
        return identity is null ? Unauthorized() : await ExecuteAsync(() => respuestas.DeleteAsync(id, identity.Value.Carnet, identity.Value.IsAdmin));
    }

    private async Task<(string Carnet, bool IsAdmin)?> GetIdentityAsync()
    {
        var carnet = User.FindFirst("nCarnet")?.Value;
        if (string.IsNullOrWhiteSpace(carnet)) return null;
        return (carnet, await database.Roles.AnyAsync(role => role.NCarnet == carnet && role.IsAdmin));
    }

    private async Task<IActionResult> ExecuteAsync<T>(Func<Task<T?>> operation) where T : class
    {
        try
        {
            var result = await operation();
            return result is null ? NotFound(new { message = "No se ha encontrado el recurso solicitado." }) : Ok(result);
        }
        catch (UnauthorizedAccessException) { return User.Identity?.IsAuthenticated == true ? Forbid() : Unauthorized(); }
        catch (KeyNotFoundException error) { return NotFound(new { message = error.Message }); }
        catch (InvalidOperationException error) { return Conflict(new { message = error.Message }); }
        catch (ArgumentException error) { return BadRequest(new { message = error.Message }); }
    }
}
