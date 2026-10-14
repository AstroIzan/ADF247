using ADF247.Batch.Worker;
using ADF247.Batch.Worker.Configuration;
using ADF247.Batch.Worker.Services;
using ADF247.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = Host.CreateApplicationBuilder(args);
var connectionString = FirstNonEmpty(
    builder.Configuration.GetConnectionString("Adf247"),
    builder.Configuration["DATABASE_CONNECTION_STRING"],
    ConvertPrismaSqlServerUrl(builder.Configuration["DATABASE_URL"]));

builder.Services.Configure<BatchDatabaseOptions>(options => options.ConnectionString = connectionString);
builder.Services.AddDbContext<Adf247DbContext>(options =>
{
    if (string.IsNullOrWhiteSpace(connectionString))
        throw new InvalidOperationException("DATABASE_URL or SQL connection string is not configured.");
    options.UseSqlServer(connectionString);
});
builder.Services.AddHttpClient<PlaAlfaLevelProvider>(client => client.Timeout = TimeSpan.FromSeconds(20));
builder.Services.AddScoped<BatchTaskExecutionService>();
builder.Services.AddScoped<BatchOrchestrator>();
builder.Services.AddHostedService<BatchWorker>();

await builder.Build().RunAsync();

static string? ConvertPrismaSqlServerUrl(string? databaseUrl)
{
    const string prefix = "sqlserver://";
    if (string.IsNullOrWhiteSpace(databaseUrl) || !databaseUrl.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        return null;

    var segments = databaseUrl[prefix.Length..].Split(';', 2);
    var server = segments[0].Replace(":", ",", StringComparison.Ordinal);
    var properties = (segments.Length == 2 ? segments[1] : string.Empty)
        .Replace("user=", "User ID=", StringComparison.OrdinalIgnoreCase);
    return $"Server={server};{properties}";
}

static string? FirstNonEmpty(params string?[] values) =>
    values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));
