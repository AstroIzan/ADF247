using ADF247.Messaging.Worker.Configuration;
using ADF247.Messaging.Worker.Services;

var builder = Host.CreateApplicationBuilder(args);

var runbookPath = builder.Configuration["MESSAGING_RUNBOOK_PATH"] ?? "messaging-runbook.json";

builder.Services.Configure<MessagingWorkerOptions>(builder.Configuration.GetSection(MessagingWorkerOptions.SectionName));
builder.Services.Configure<MessagingFirebaseOptions>(builder.Configuration.GetSection(MessagingFirebaseOptions.SectionName));
builder.Services.PostConfigure<MessagingFirebaseOptions>(options =>
{
    options.ServiceAccountPath = FirstNonEmpty(
        builder.Configuration["FIREBASE_SERVICE_ACCOUNT_PATH"],
        options.ServiceAccountPath)
        ?? "/run/secrets/firebase-service-account.json";
});
builder.Services.Configure<MessagingDatabaseOptions>(options =>
{
    options.ConnectionString = FirstNonEmpty(
        builder.Configuration.GetConnectionString("Adf247"),
        builder.Configuration["DATABASE_CONNECTION_STRING"],
        ConvertPrismaSqlServerUrl(builder.Configuration["DATABASE_URL"]));
});

builder.Services.AddSingleton<IMessagingRunbookProvider>(_ =>
    new JsonMessagingRunbookProvider(runbookPath));
builder.Services.AddSingleton<IFirebaseNotificationSender, FirebaseNotificationSender>();
builder.Services.AddSingleton<INotificationDispatchRepository, SqlNotificationDispatchRepository>();
builder.Services.AddSingleton<IMessagingReadinessProbe, SqlMessagingReadinessProbe>();
builder.Services.AddHostedService<MessagingOrchestrationWorker>();

await builder.Build().RunAsync();

static string? ConvertPrismaSqlServerUrl(string? databaseUrl)
{
    const string prefix = "sqlserver://";
    if (string.IsNullOrWhiteSpace(databaseUrl) || !databaseUrl.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
    {
        return null;
    }

    var segments = databaseUrl[prefix.Length..].Split(';', 2);
    var server = segments[0].Replace(":", ",", StringComparison.Ordinal);
    var properties = segments.Length == 2 ? segments[1] : string.Empty;
    properties = properties.Replace("user=", "User ID=", StringComparison.OrdinalIgnoreCase);

    return $"Server={server};{properties}";
}

static string? FirstNonEmpty(params string?[] values) =>
    values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));
