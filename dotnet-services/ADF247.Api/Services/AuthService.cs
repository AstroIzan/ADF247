using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using ADF247.Api.Contracts;
using ADF247.Api.Data;
using ADF247.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ADF247.Api.Services;

public sealed class AuthService(
    Adf247DbContext database,
    JwtTokenService tokens)
{
    public async Task<SessionResponse?> LoginAsync(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.NCarnet) || string.IsNullOrWhiteSpace(request.Password))
        {
            return null;
        }

        var user = await FindByNCarnetAsync(request.NCarnet.Trim());
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.Password) || !user.IsActive)
        {
            return null;
        }

        return CreateSession(user);
    }

    public async Task<SessionResponse?> RefreshAsync(RefreshRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return null;
        }

        ClaimsPrincipal principal;
        try
        {
            principal = tokens.ValidateRefreshToken(request.RefreshToken);
        }
        catch
        {
            return null;
        }

        if (principal.FindFirstValue("type") != "refresh"
            || !int.TryParse(principal.FindFirstValue(JwtRegisteredClaimNames.Sub), out var userId))
        {
            return null;
        }

        var user = await database.Users.Include(user => user.Roles)
            .SingleOrDefaultAsync(user => user.Id == userId);
        return user is null || !user.IsActive ? null : CreateSession(user);
    }

    public async Task<UserResponse?> GetCurrentUserAsync(int userId)
    {
        var user = await database.Users.Include(user => user.Roles)
            .SingleOrDefaultAsync(user => user.Id == userId);
        return user is null || !user.IsActive ? null : UserService.MapUser(user);
    }

    private async Task<User?> FindByNCarnetAsync(string nCarnet) =>
        await database.Users.Include(user => user.Roles)
            .SingleOrDefaultAsync(user => user.NCarnet == nCarnet);

    private SessionResponse CreateSession(User user) =>
        new(
            tokens.CreateAccessToken(user),
            "Bearer",
            tokens.AccessExpiresIn,
            tokens.CreateRefreshToken(user),
            tokens.RefreshExpiresIn,
            UserService.MapUser(user));
}
