using ADF247.Messaging.Worker.Configuration;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;

namespace ADF247.Messaging.Worker.Services;

public sealed class SqlMessagingReadinessProbe(
    IOptionsMonitor<MessagingDatabaseOptions> databaseOptions,
    IOptionsMonitor<MessagingFirebaseOptions> firebaseOptions,
    ILogger<SqlMessagingReadinessProbe> logger) : IMessagingReadinessProbe
{
    public async Task<MessagingReadinessResult> CheckAsync(CancellationToken cancellationToken)
    {
        var connectionString = databaseOptions.CurrentValue.ConnectionString;
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return MessagingReadinessResult.NotReady("DATABASE_URL or SQL connection string is not configured.");
        }

        try
        {
            await using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync(cancellationToken);
            await connection.CloseAsync();
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Messaging worker database readiness probe failed.");
            return MessagingReadinessResult.NotReady("Database is unreachable.");
        }

        var serviceAccountPath = firebaseOptions.CurrentValue.ServiceAccountPath;
        if (string.IsNullOrWhiteSpace(serviceAccountPath))
        {
            return MessagingReadinessResult.NotReady("Firebase service account path is not configured.");
        }

        var resolvedPath = Path.GetFullPath(serviceAccountPath);
        if (!File.Exists(resolvedPath))
        {
            return MessagingReadinessResult.NotReady($"Firebase service account file is missing at '{resolvedPath}'.");
        }

        return MessagingReadinessResult.Ready();
    }
}
