using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ADF247.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace ADF247.Api.Services;

public sealed class JwtTokenService(IConfiguration configuration)
{
    public string AccessExpiresIn =>
        configuration["JWT_EXPIRES_IN"] ?? configuration["Jwt:AccessExpiresIn"] ?? "30d";

    public string RefreshExpiresIn =>
        configuration["JWT_REFRESH_EXPIRES_IN"] ?? configuration["Jwt:RefreshExpiresIn"] ?? "90d";

    public string CreateAccessToken(User user) => CreateToken(
        user,
        "access",
        configuration["JWT_SECRET"] ?? "adf247-dev-secret-change-me",
        AccessExpiresIn);

    public string CreateRefreshToken(User user) => CreateToken(
        user,
        "refresh",
        configuration["JWT_REFRESH_SECRET"] ?? "adf247-dev-refresh-secret-change-me",
        RefreshExpiresIn);

    public ClaimsPrincipal ValidateRefreshToken(string token)
    {
        var secret = configuration["JWT_REFRESH_SECRET"] ?? "adf247-dev-refresh-secret-change-me";
        var handler = new JwtSecurityTokenHandler();
        return handler.ValidateToken(token, new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
            ClockSkew = TimeSpan.Zero,
        }, out _);
    }

    private static string CreateToken(User user, string type, string secret, string expiresIn)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim("nCarnet", user.NCarnet),
            new Claim("type", type),
        };
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
            SecurityAlgorithms.HmacSha256);
        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.Add(ParseDuration(expiresIn)),
            SigningCredentials = credentials,
        };

        return new JwtSecurityTokenHandler().WriteToken(
            new JwtSecurityTokenHandler().CreateToken(descriptor));
    }

    private static TimeSpan ParseDuration(string value)
    {
        if (value.EndsWith('h') && int.TryParse(value[..^1], out var hours))
        {
            return TimeSpan.FromHours(hours);
        }

        if (value.EndsWith('d') && int.TryParse(value[..^1], out var days))
        {
            return TimeSpan.FromDays(days);
        }

        return TimeSpan.FromDays(30);
    }
}
