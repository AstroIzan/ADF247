using System.Text;
using ADF247.Api.Data;
using ADF247.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

var configuredConnectionString = builder.Configuration.GetConnectionString("Adf247")
    ?? builder.Configuration["DATABASE_CONNECTION_STRING"]
    ?? ConvertPrismaSqlServerUrl(builder.Configuration["DATABASE_URL"]);

var connectionString = configuredConnectionString
    ?? "Server=localhost;Database=ADF247;Integrated Security=True;TrustServerCertificate=True";

builder.Services.AddDbContext<Adf247DbContext>(options =>
    options.UseSqlServer(connectionString));

var jwtSecret = builder.Configuration["JWT_SECRET"] ?? "adf247-dev-secret-change-me";
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,
            ClockSkew = TimeSpan.Zero,
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddHealthChecks();
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UserService>();

var app = builder.Build();

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await context.Response.WriteAsJsonAsync(new
        {
            message = "Ha ocurrido un error interno en el servidor.",
        });
    });
});

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { ok = true, service = "api-dotnet" }));
app.MapGet("/api/health", async (Adf247DbContext database, CancellationToken cancellationToken) =>
{
    var databaseAvailable = await database.Database.CanConnectAsync(cancellationToken);
    return databaseAvailable
        ? Results.Ok(new { ok = true, service = "api-dotnet", dependencies = new { database = "connected" } })
        : Results.Problem(
            statusCode: StatusCodes.Status503ServiceUnavailable,
            title: "Database connection unavailable.");
});
app.MapControllers();

app.Run();

static string? ConvertPrismaSqlServerUrl(string? databaseUrl)
{
    const string prefix = "sqlserver://";
    if (string.IsNullOrWhiteSpace(databaseUrl) || !databaseUrl.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
    {
        return null;
    }

    var segments = databaseUrl[prefix.Length..].Split(';', 2);
    var server = segments[0];
    var properties = segments.Length == 2 ? segments[1] : string.Empty;
    properties = properties.Replace("user=", "User ID=", StringComparison.OrdinalIgnoreCase);

    return $"Server={server};{properties}";
}
