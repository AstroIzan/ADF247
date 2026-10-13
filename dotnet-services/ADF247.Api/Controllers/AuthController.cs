using System.IdentityModel.Tokens.Jwt;
using ADF247.Api.Contracts;
using ADF247.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ADF247.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(AuthService authService) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var session = await authService.LoginAsync(request);
        return session is null
            ? Unauthorized(new { message = "Credenciales invalidas." })
            : Ok(session);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(RefreshRequest request)
    {
        var session = await authService.RefreshAsync(request);
        return session is null
            ? Unauthorized(new { message = "El refresh token no es valido o ha expirado." })
            : Ok(session);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var subject = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        if (!int.TryParse(subject, out var userId))
        {
            return Unauthorized(new { message = "El token no es valido o ha expirado." });
        }

        var user = await authService.GetCurrentUserAsync(userId);
        return user is null
            ? Unauthorized(new { message = "No se ha encontrado el usuario autenticado." })
            : Ok(user);
    }
}
