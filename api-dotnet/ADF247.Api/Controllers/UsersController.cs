using ADF247.Api.Contracts;
using ADF247.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ADF247.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/users")]
public sealed class UsersController(UserService users) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await users.GetAllAsync());

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
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var user = await users.DeleteAsync(id);
        return user is null
            ? NotFound(new { message = "No se ha encontrado el usuario solicitado." })
            : Ok(user);
    }
}
