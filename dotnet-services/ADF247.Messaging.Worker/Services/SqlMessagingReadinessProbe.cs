using ADF247.Messaging.Worker.Configuration;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;

namespace ADF247.Messaging.Worker.Services;

public sealed class SqlMessagingReadinessProbe(
    IOptionsMonitor<MessagingDatabaseOptions> databaseOptions,
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

        return MessagingReadinessResult.Ready();
    }
}
