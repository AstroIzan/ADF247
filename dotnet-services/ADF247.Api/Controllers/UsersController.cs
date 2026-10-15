using ADF247.Api.Contracts;
using ADF247.Api.Data;
using ADF247.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ADF247.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/users")]
public sealed class UsersController(UserService users, Adf247DbContext database) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? page, [FromQuery] int? pageSize)
    {
        if (page.HasValue != pageSize.HasValue) return BadRequest(new { message = "Debes enviar page y pageSize juntos para usar paginacion." });
        try { return Ok(page.HasValue ? await users.GetPageAsync(page.Value, pageSize!.Value) : await users.GetAllAsync()); }
        catch (ArgumentException error) { return BadRequest(new { message = error.Message }); }
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var user = await users.GetByIdAsync(id);
        return user is null
            ? NotFound(new { message = "No se ha encontrado el usuario solicitado." })
            : Ok(user);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateUserRequest request)
    {
        if (!await IsAdminAsync()) return Forbid();
        try
        {
            var user = await users.CreateAsync(request);
            return user is null
                ? BadRequest(new { message = "nCarnet, name y password son obligatorios." })
                : CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
        }
        catch (InvalidOperationException error)
        {
            return Conflict(new { message = error.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateUserRequest request)
    {
        var isAdmin = await IsAdminAsync();
        if (!isAdmin && !IsCurrentUser(id)) return Forbid();
        if (!isAdmin && (request.NCarnet is not null || request.NIndicatiu is not null || request.Phone is not null || request.IsActive.HasValue || request.Roles is not null))
            return Forbid();
        try
        {
            var user = await users.UpdateAsync(id, request);
            return user is null
                ? NotFound(new { message = "No se ha encontrado el usuario solicitado." })
                : Ok(user);
        }
        catch (ArgumentException error)
        {
            return BadRequest(new { message = error.Message });
        }
        catch (InvalidOperationException error) { return Conflict(new { message = error.Message }); }
    }

    [HttpPost("import")]
    public async Task<IActionResult> Import(ImportUsersRequest request)
    {
        if (!await IsAdminAsync()) return Forbid();
        try { return Ok(await users.ImportAsync(request)); }
        catch (ArgumentException error) { return BadRequest(new { message = error.Message }); }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        if (!await IsAdminAsync()) return Forbid();
        var user = await users.DeleteAsync(id);
        return user is null
            ? NotFound(new { message = "No se ha encontrado el usuario solicitado." })
            : Ok(user);
    }

    private Task<bool> IsAdminAsync()
    {
        var carnet = User.FindFirst("nCarnet")?.Value;
        return string.IsNullOrWhiteSpace(carnet)
            ? Task.FromResult(false)
            : database.Roles.AnyAsync(role => role.NCarnet == carnet && role.IsAdmin);
    }

    private bool IsCurrentUser(int id) =>
        int.TryParse(User.FindFirst("sub")?.Value, out var currentUserId) && currentUserId == id;
}
