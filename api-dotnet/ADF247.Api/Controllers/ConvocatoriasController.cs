using ADF247.Api.Contracts;
using ADF247.Api.Data;
using ADF247.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ADF247.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/convos")]
public sealed class ConvocatoriasController(ConvocatoriaService convos, Adf247DbContext database) : ControllerBase
{
    [HttpGet("types")] public async Task<IActionResult> GetTypes() => Ok(await convos.GetTypesAsync());
    [HttpGet("types/{id:int}")] public async Task<IActionResult> GetType(int id) => await ExecuteAsync(() => convos.GetTypeAsync(id));
    [HttpPost("types")] public Task<IActionResult> CreateType(ConvoTypeRequest request) => ExecuteCreatedAsync(() => convos.CreateTypeAsync(request));
    [HttpPut("types/{id:int}")] public Task<IActionResult> UpdateType(int id, ConvoTypeRequest request) => ExecuteAsync(() => convos.UpdateTypeAsync(id, request));
    [HttpDelete("types/{id:int}")] public Task<IActionResult> DeleteType(int id) => ExecuteAsync(() => convos.DeleteTypeAsync(id));

    [HttpGet] public Task<IActionResult> GetAll([FromQuery] int? page, [FromQuery] int? pageSize) => ExecuteCreatedAsync(() => convos.GetAllAsync(page, pageSize), false);
    [HttpGet("{id:int}")] public Task<IActionResult> Get(int id) => ExecuteAsync(() => convos.GetAsync(id));
    [HttpPost] public Task<IActionResult> Create(ConvocatoriaRequest request) => ExecuteCreatedAsync(() => convos.CreateAsync(request));
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, ConvocatoriaRequest request)
    {
        var identity = await IdentityAsync(); if (identity is null) return Unauthorized();
        return await ExecuteAsync(() => convos.UpdateAsync(id, request, identity.Value.UserId, identity.Value.IsAdmin));
    }
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) => await convos.DeleteAsync(id) ? NoContent() : NotFound(new { message = "No se ha encontrado la convocatoria solicitada." });
    [HttpPatch("{id:int}/lifecycle")]
    public async Task<IActionResult> Lifecycle(int id, LifecycleRequest request)
    {
        var identity = await IdentityAsync(); if (identity is null) return Unauthorized();
        return await ExecuteAsync(() => convos.UpdateLifecycleAsync(id, request, identity.Value.UserId, identity.Value.IsAdmin));
    }
    [HttpPost("{id:int}/start")]
    public async Task<IActionResult> Start(int id, CampaignFormRequest request)
    {
        var identity = await IdentityAsync(); if (identity is null) return Unauthorized();
        return await ExecuteAsync(() => convos.StartAsync(id, request, identity.Value.UserId, identity.Value.Carnet, identity.Value.IsAdmin));
    }
    [HttpPost("{id:int}/finish")]
    public async Task<IActionResult> Finish(int id, CampaignFormRequest request)
    {
        var identity = await IdentityAsync(); if (identity is null) return Unauthorized();
        return await ExecuteAsync(() => convos.FinishAsync(id, request, identity.Value.UserId, identity.Value.Carnet, identity.Value.IsAdmin));
    }
    [HttpGet("campaign-forms/list")]
    public async Task<IActionResult> Forms([FromQuery] int? convoId, [FromQuery] string? serviceMoment)
    {
        var identity = await IdentityAsync(); if (identity is null) return Unauthorized();
        return await ExecuteCreatedAsync(() => convos.ListFormsAsync(convoId, serviceMoment, identity.Value.UserId, identity.Value.IsAdmin), false);
    }
    [HttpDelete("campaign-forms/{id:int}")]
    public async Task<IActionResult> DeleteForm(int id)
    {
        var identity = await IdentityAsync(); if (identity is null) return Unauthorized();
        return await ExecuteAsync(() => convos.DeleteFormAsync(id, identity.Value.UserId, identity.Value.IsAdmin));
    }
    [HttpGet("{id:int}/campaign-form-context")]
    public async Task<IActionResult> Context(int id, [FromQuery] string? mode)
    {
        var identity = await IdentityAsync(); if (identity is null) return Unauthorized();
        return await ExecuteCreatedAsync(() => convos.GetCampaignContextAsync(id, mode, identity.Value.UserId, identity.Value.IsAdmin), false);
    }

    private async Task<(int UserId, string Carnet, bool IsAdmin)?> IdentityAsync()
    {
        var carnet = User.FindFirst("nCarnet")?.Value;
        if (string.IsNullOrWhiteSpace(carnet)) return null;
        var user = await database.Users.Where(item => item.NCarnet == carnet).Select(item => new { item.Id }).SingleOrDefaultAsync();
        if (user is null) return null;
        return (user.Id, carnet, await database.Roles.AnyAsync(role => role.NCarnet == carnet && role.IsAdmin));
    }

    private async Task<IActionResult> ExecuteAsync<T>(Func<Task<T?>> action) where T : class
    {
        try { var result = await action(); return result is null ? NotFound(new { message = "No se ha encontrado el recurso solicitado." }) : Ok(result); }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (KeyNotFoundException error) { return NotFound(new { message = error.Message }); }
        catch (InvalidOperationException error) { return Conflict(new { message = error.Message }); }
        catch (ArgumentException error) { return BadRequest(new { message = error.Message }); }
    }
    private async Task<IActionResult> ExecuteCreatedAsync<T>(Func<Task<T>> action, bool created = true)
    {
        try { var result = await action(); return created ? StatusCode(StatusCodes.Status201Created, result) : Ok(result); }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (KeyNotFoundException error) { return NotFound(new { message = error.Message }); }
        catch (InvalidOperationException error) { return Conflict(new { message = error.Message }); }
        catch (ArgumentException error) { return BadRequest(new { message = error.Message }); }
    }
}
