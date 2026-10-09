using ADF247.Messaging.Worker.Configuration;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;

namespace ADF247.Messaging.Worker.Services;

public sealed class SqlNotificationDispatchRepository(
    IOptionsMonitor<MessagingDatabaseOptions> databaseOptions) : INotificationDispatchRepository
{
    public async Task<RunbookExecutionStartResult> TryStartRunbookExecutionAsync(
        string runbookKey,
        string trigger,
        DateTimeOffset localMinute,
        string? detailsJson,
        CancellationToken cancellationToken)
    {
        var localMinuteStart = new DateTimeOffset(
            localMinute.Year,
            localMinute.Month,
            localMinute.Day,
            localMinute.Hour,
            localMinute.Minute,
            0,
            localMinute.Offset);
        var windowStartUtc = localMinuteStart.UtcDateTime;
        var windowEndUtc = localMinuteStart.AddMinutes(1).UtcDateTime;

        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText =
            """
            SET XACT_ABORT ON;
            BEGIN TRAN;

            DECLARE @results TABLE (
                [ShouldRun] BIT NOT NULL,
                [ExecutionId] BIGINT NULL
            );

            IF EXISTS (
                SELECT 1
                FROM [Messaging].[RunbookExecution] WITH (UPDLOCK, HOLDLOCK)
                WHERE [runbookKey] = @RunbookKey
                    AND [trigger] = @Trigger
                    AND [startedAt] >= @WindowStartUtc
                    AND [startedAt] < @WindowEndUtc
            )
            BEGIN
                INSERT INTO @results ([ShouldRun], [ExecutionId])
                VALUES (0, NULL);
            END
            ELSE
            BEGIN
                INSERT INTO [Messaging].[RunbookExecution] (
                    [runbookKey],
                    [trigger],
                    [status],
                    [startedAt],
                    [detailsJson]
                )
                OUTPUT
                    CAST(1 AS BIT),
                    inserted.[id]
                INTO @results ([ShouldRun], [ExecutionId])
                VALUES (
                    @RunbookKey,
                    @Trigger,
                    N'running',
                    SYSUTCDATETIME(),
                    @DetailsJson
                );
            END

            COMMIT TRAN;
            SELECT [ShouldRun], [ExecutionId] FROM @results;
            """;
        command.Parameters.Add(new SqlParameter("@RunbookKey", System.Data.SqlDbType.NVarChar, 100) { Value = Truncate(runbookKey, 100) });
        command.Parameters.Add(new SqlParameter("@Trigger", System.Data.SqlDbType.NVarChar, 30) { Value = Truncate(trigger, 30) });
        command.Parameters.Add(new SqlParameter("@WindowStartUtc", System.Data.SqlDbType.DateTime2) { Value = windowStartUtc });
        command.Parameters.Add(new SqlParameter("@WindowEndUtc", System.Data.SqlDbType.DateTime2) { Value = windowEndUtc });
        command.Parameters.Add(new SqlParameter("@DetailsJson", System.Data.SqlDbType.NVarChar, -1)
        {
            Value = string.IsNullOrWhiteSpace(detailsJson) ? DBNull.Value : detailsJson,
        });

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return new RunbookExecutionStartResult(false, null);
        }

        return new RunbookExecutionStartResult(
            ShouldRun: reader.GetBoolean(0),
            ExecutionId: reader.IsDBNull(1) ? null : reader.GetInt64(1));
    }

    public async Task CompleteRunbookExecutionAsync(
        long executionId,
        string status,
        string? detailsJson,
        string? errorMessage,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText =
            """
            UPDATE [Messaging].[RunbookExecution]
            SET [status] = @Status,
                [finishedAt] = SYSUTCDATETIME(),
                [detailsJson] = @DetailsJson,
                [errorMessage] = @ErrorMessage
            WHERE [id] = @ExecutionId;
            """;
        command.Parameters.Add(new SqlParameter("@ExecutionId", System.Data.SqlDbType.BigInt) { Value = executionId });
        command.Parameters.Add(new SqlParameter("@Status", System.Data.SqlDbType.NVarChar, 30)
        {
            Value = Truncate(status, 30),
        });
        command.Parameters.Add(new SqlParameter("@DetailsJson", System.Data.SqlDbType.NVarChar, -1)
        {
            Value = string.IsNullOrWhiteSpace(detailsJson) ? DBNull.Value : detailsJson,
        });
        command.Parameters.Add(new SqlParameter("@ErrorMessage", System.Data.SqlDbType.NVarChar, -1)
        {
            Value = string.IsNullOrWhiteSpace(errorMessage) ? DBNull.Value : Truncate(errorMessage, 4000),
        });
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<RunbookQueueResult> QueueNotificationFromConfigurationAsync(
        string runbookKey,
        string templateKey,
        string notificationTrigger,
        string? payloadJson,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText =
            """
            DECLARE @configurationId INT;
            DECLARE @title NVARCHAR(MAX);
            DECLARE @body NVARCHAR(MAX);
            DECLARE @enabled BIT;

            SELECT TOP (1)
                @configurationId = c.[id],
                @title = c.[titleTemplate],
                @body = c.[bodyTemplate],
                @enabled = c.[enabled]
            FROM [Messaging].[Configuration] c
            WHERE c.[key] = @TemplateKey
            ORDER BY c.[id];

            IF @configurationId IS NULL
            BEGIN
                SELECT
                    CAST(0 AS BIT) AS [notificationQueued],
                    CAST(NULL AS BIGINT) AS [notificationId],
                    N'skipped' AS [status],
                    N'No matching Messaging.Configuration row found for template key.' AS [message];
                RETURN;
            END;

            IF @enabled = 0
            BEGIN
                SELECT
                    CAST(0 AS BIT) AS [notificationQueued],
                    CAST(NULL AS BIGINT) AS [notificationId],
                    N'skipped' AS [status],
                    N'Messaging.Configuration row is disabled.' AS [message];
                RETURN;
            END;

            DECLARE @results TABLE (
                [notificationQueued] BIT NOT NULL,
                [notificationId] BIGINT NULL,
                [status] NVARCHAR(30) NOT NULL,
                [message] NVARCHAR(MAX) NOT NULL
            );

            INSERT INTO [Messaging].[Notification] (
                [configurationId],
                [convocatoriaId],
                [trigger],
                [status],
                [title],
                [body],
                [payloadJson],
                [scheduledFor],
                [startedAt],
                [completedAt],
                [requestedCount],
                [successCount],
                [failureCount],
                [actorUserId],
                [errorMessage]
            )
            OUTPUT
                CAST(1 AS BIT),
                inserted.[id],
                N'queued',
                N'Queued from runbook configuration.'
            INTO @results ([notificationQueued], [notificationId], [status], [message])
            VALUES (
                @configurationId,
                NULL,
                @NotificationTrigger,
                N'queued',
                @title,
                @body,
                @PayloadJson,
                NULL,
                NULL,
                NULL,
                0,
                0,
                0,
                NULL,
                NULL
            );

            SELECT [notificationQueued], [notificationId], [status], [message] FROM @results;
            """;
        command.Parameters.Add(new SqlParameter("@TemplateKey", System.Data.SqlDbType.NVarChar, 100) { Value = Truncate(templateKey, 100) });
        command.Parameters.Add(new SqlParameter("@NotificationTrigger", System.Data.SqlDbType.NVarChar, 50)
        {
            Value = Truncate(notificationTrigger, 50),
        });
        command.Parameters.Add(new SqlParameter("@PayloadJson", System.Data.SqlDbType.NVarChar, -1)
        {
            Value = string.IsNullOrWhiteSpace(payloadJson) ? DBNull.Value : payloadJson,
        });

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return new RunbookQueueResult(false, null, "failed", "Failed to queue runbook notification.");
        }

        return new RunbookQueueResult(
            NotificationQueued: reader.GetBoolean(0),
            NotificationId: reader.IsDBNull(1) ? null : reader.GetInt64(1),
            Status: reader.IsDBNull(2) ? "failed" : reader.GetString(2),
            Message: reader.IsDBNull(3) ? "Unknown queue result." : reader.GetString(3));
    }

    public async Task<IReadOnlyList<ClaimedNotification>> ClaimQueuedNotificationsAsync(int batchSize, CancellationToken cancellationToken)
    {
        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText =
            """
            ;WITH claimable AS (
                SELECT TOP (@BatchSize) n.[id]
                FROM [Messaging].[Notification] n WITH (UPDLOCK, READPAST, ROWLOCK)
                WHERE (
                        n.[status] = N'queued'
                        AND (n.[scheduledFor] IS NULL OR n.[scheduledFor] <= SYSUTCDATETIME())
                    )
                    OR n.[status] = N'processing'
                ORDER BY
                    CASE WHEN n.[status] = N'queued' THEN 0 ELSE 1 END,
                    COALESCE(n.[scheduledFor], n.[createdAt]),
                    n.[id]
            )
            UPDATE n
            SET [status] = N'processing',
                [startedAt] = COALESCE(n.[startedAt], SYSUTCDATETIME()),
                [completedAt] = NULL,
                [errorMessage] = NULL
            OUTPUT inserted.[id], inserted.[convocatoriaId], inserted.[trigger], inserted.[title], inserted.[body], inserted.[payloadJson]
            FROM [Messaging].[Notification] n
            INNER JOIN claimable c ON c.[id] = n.[id];
            """;
        command.Parameters.Add(new SqlParameter("@BatchSize", System.Data.SqlDbType.Int) { Value = Math.Max(1, batchSize) });

        var claimed = new List<ClaimedNotification>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            claimed.Add(new ClaimedNotification(
                Id: reader.GetInt64(0),
                ConvocatoriaId: reader.IsDBNull(1) ? null : reader.GetInt32(1),
                Trigger: reader.IsDBNull(2) ? string.Empty : reader.GetString(2),
                Title: reader.IsDBNull(3) ? string.Empty : reader.GetString(3),
                Body: reader.IsDBNull(4) ? string.Empty : reader.GetString(4),
                PayloadJson: reader.IsDBNull(5) ? null : reader.GetString(5)));
        }

        return claimed;
    }

    public async Task<int> EnsureNotificationDeliveriesAsync(
        long notificationId,
        int? convocatoriaId,
        RecipientSelectionBehavior selectionBehavior,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText =
            """
            INSERT INTO [Messaging].[NotificationDelivery] (
                [notificationId],
                [deviceRegistrationId],
                [userId],
                [nCarnet],
                [status]
            )
            SELECT
                @NotificationId,
                r.[id],
                r.[userId],
                r.[nCarnet],
                N'pending'
            FROM [Messaging].[DeviceRegistration] r
            LEFT JOIN [Messaging].[NotificationDelivery] d
                ON d.[notificationId] = @NotificationId
                AND d.[deviceRegistrationId] = r.[id]
            WHERE r.[isActive] = 1
                AND r.[invalidatedAt] IS NULL
                AND d.[id] IS NULL
                AND (
                    @ConvocatoriaId IS NULL
                    OR NOT EXISTS (
                        SELECT 1
                        FROM [dbo].[Respuesta] rn
                        WHERE rn.[convoId] = @ConvocatoriaId
                            AND rn.[userNCarnet] = r.[nCarnet]
                            AND rn.[response] = 0
                    )
                )
                AND (
                    @SelectionMode = @SelectionBroadcast
                    OR (
                        @SelectionMode = @SelectionResponseRequest
                        AND @ConvocatoriaId IS NOT NULL
                        AND EXISTS (
                            SELECT 1
                            FROM [dbo].[Convocatoria] c
                            WHERE c.[id] = @ConvocatoriaId
                                AND c.[sortida] = 0
                        )
                        AND NOT EXISTS (
                            SELECT 1
                            FROM [dbo].[Respuesta] rr
                            WHERE rr.[convoId] = @ConvocatoriaId
                                AND rr.[userNCarnet] = r.[nCarnet]
                        )
                    )
                    OR (
                        @SelectionMode = @SelectionSortidaStatus
                        AND @ConvocatoriaId IS NOT NULL
                        AND EXISTS (
                            SELECT 1
                            FROM [dbo].[Convocatoria] c
                            WHERE c.[id] = @ConvocatoriaId
                                AND c.[sortida] = 1
                        )
                        AND EXISTS (
                            SELECT 1
                            FROM [dbo].[Respuesta] ra
                            WHERE ra.[convoId] = @ConvocatoriaId
                                AND ra.[userNCarnet] = r.[nCarnet]
                                AND ra.[response] = 1
                        )
                    )
                );
            """;
        command.Parameters.Add(new SqlParameter("@NotificationId", System.Data.SqlDbType.BigInt) { Value = notificationId });
        command.Parameters.Add(new SqlParameter("@ConvocatoriaId", System.Data.SqlDbType.Int)
        {
            Value = convocatoriaId.HasValue ? convocatoriaId.Value : DBNull.Value,
        });
        command.Parameters.Add(new SqlParameter("@SelectionMode", System.Data.SqlDbType.Int) { Value = (int)selectionBehavior });
        command.Parameters.Add(new SqlParameter("@SelectionBroadcast", System.Data.SqlDbType.Int) { Value = (int)RecipientSelectionBehavior.BroadcastAllDevices });
        command.Parameters.Add(new SqlParameter("@SelectionResponseRequest", System.Data.SqlDbType.Int) { Value = (int)RecipientSelectionBehavior.ConvocatoriaResponseRequest });
        command.Parameters.Add(new SqlParameter("@SelectionSortidaStatus", System.Data.SqlDbType.Int) { Value = (int)RecipientSelectionBehavior.ConvocatoriaSortidaStatus });
        return await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<int> RequeueRetryableDeliveriesAsync(long notificationId, int maxAttempts, CancellationToken cancellationToken)
    {
        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText =
            """
            DECLARE @changes TABLE ([kind] NVARCHAR(20) NOT NULL);

            UPDATE d
            SET d.[status] = N'pending',
                d.[errorCode] = N'retry-pending',
                d.[errorMessage] = N'Requeued after transient failure.'
            OUTPUT N'requeued' INTO @changes([kind])
            FROM [Messaging].[NotificationDelivery] d
            WHERE d.[notificationId] = @NotificationId
                AND d.[attemptCount] < @MaxAttempts
                AND (
                    d.[status] = N'sending'
                    OR (
                        d.[status] = N'failed'
                        AND d.[errorCode] IN (N'fcm-unavailable', N'fcm-internal', N'fcm-quota-exceeded')
                    )
                );

            UPDATE d
            SET d.[status] = N'failed',
                d.[errorCode] = N'max-attempts-exceeded',
                d.[errorMessage] = N'Max delivery attempts exceeded after worker recovery.'
            OUTPUT N'exhausted' INTO @changes([kind])
            FROM [Messaging].[NotificationDelivery] d
            WHERE d.[notificationId] = @NotificationId
                AND d.[status] = N'sending'
                AND d.[attemptCount] >= @MaxAttempts;

            SELECT CAST(COUNT_BIG(1) AS INT)
            FROM @changes
            WHERE [kind] = N'requeued';
            """;
        command.Parameters.Add(new SqlParameter("@NotificationId", System.Data.SqlDbType.BigInt) { Value = notificationId });
        command.Parameters.Add(new SqlParameter("@MaxAttempts", System.Data.SqlDbType.Int) { Value = Math.Max(1, maxAttempts) });
        var result = await command.ExecuteScalarAsync(cancellationToken);
        return result is int value ? value : 0;
    }

    public async Task<IReadOnlyList<ClaimedDelivery>> ClaimPendingDeliveriesAsync(long notificationId, int batchSize, CancellationToken cancellationToken)
    {
        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText =
            """
            ;WITH claimable AS (
                SELECT TOP (@BatchSize) d.[id]
                FROM [Messaging].[NotificationDelivery] d WITH (UPDLOCK, READPAST, ROWLOCK)
                INNER JOIN [Messaging].[DeviceRegistration] r
                    ON r.[id] = d.[deviceRegistrationId]
                WHERE d.[notificationId] = @NotificationId
                    AND d.[status] = N'pending'
                    AND r.[isActive] = 1
                    AND r.[invalidatedAt] IS NULL
                ORDER BY d.[id]
            )
            UPDATE d
            SET [status] = N'sending',
                [attemptCount] = [attemptCount] + 1,
                [errorCode] = NULL,
                [errorMessage] = NULL
            OUTPUT inserted.[id], inserted.[deviceRegistrationId], inserted.[userId], inserted.[nCarnet], reg.[token]
            FROM [Messaging].[NotificationDelivery] d
            INNER JOIN claimable c ON c.[id] = d.[id]
            INNER JOIN [Messaging].[DeviceRegistration] reg ON reg.[id] = d.[deviceRegistrationId];
            """;
        command.Parameters.Add(new SqlParameter("@NotificationId", System.Data.SqlDbType.BigInt) { Value = notificationId });
        command.Parameters.Add(new SqlParameter("@BatchSize", System.Data.SqlDbType.Int) { Value = Math.Max(1, batchSize) });

        var claimed = new List<ClaimedDelivery>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            claimed.Add(new ClaimedDelivery(
                Id: reader.GetInt64(0),
                DeviceRegistrationId: reader.GetInt32(1),
                UserId: reader.GetInt32(2),
                NCarnet: reader.IsDBNull(3) ? string.Empty : reader.GetString(3),
                Token: reader.IsDBNull(4) ? string.Empty : reader.GetString(4)));
        }

        return claimed;
    }

    public async Task<int> MarkInactivePendingDeliveriesFailedAsync(long notificationId, CancellationToken cancellationToken)
    {
        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText =
            """
            UPDATE d
            SET d.[status] = N'failed',
                d.[attemptCount] = d.[attemptCount] + 1,
                d.[errorCode] = N'device-inactive',
                d.[errorMessage] = N'Device registration is inactive.',
                d.[sentAt] = NULL,
                d.[deliveredAt] = NULL
            FROM [Messaging].[NotificationDelivery] d
            INNER JOIN [Messaging].[DeviceRegistration] r
                ON r.[id] = d.[deviceRegistrationId]
            WHERE d.[notificationId] = @NotificationId
                AND d.[status] = N'pending'
                AND (r.[isActive] = 0 OR r.[invalidatedAt] IS NOT NULL);
            """;
        command.Parameters.Add(new SqlParameter("@NotificationId", System.Data.SqlDbType.BigInt) { Value = notificationId });
        return await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task MarkDeliverySentAsync(long deliveryId, CancellationToken cancellationToken)
    {
        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText =
            """
            UPDATE [Messaging].[NotificationDelivery]
            SET [status] = N'sent',
                [sentAt] = COALESCE([sentAt], SYSUTCDATETIME()),
                [deliveredAt] = COALESCE([deliveredAt], SYSUTCDATETIME()),
                [errorCode] = NULL,
                [errorMessage] = NULL
            WHERE [id] = @DeliveryId;
            """;
        command.Parameters.Add(new SqlParameter("@DeliveryId", System.Data.SqlDbType.BigInt) { Value = deliveryId });
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task MarkDeliveryFailedAsync(long deliveryId, string errorCode, string errorMessage, CancellationToken cancellationToken)
    {
        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText =
            """
            UPDATE [Messaging].[NotificationDelivery]
            SET [status] = N'failed',
                [errorCode] = @ErrorCode,
                [errorMessage] = @ErrorMessage
            WHERE [id] = @DeliveryId;
            """;
        command.Parameters.Add(new SqlParameter("@DeliveryId", System.Data.SqlDbType.BigInt) { Value = deliveryId });
        command.Parameters.Add(new SqlParameter("@ErrorCode", System.Data.SqlDbType.NVarChar, 100)
        {
            Value = Truncate(errorCode, 100),
        });
        command.Parameters.Add(new SqlParameter("@ErrorMessage", System.Data.SqlDbType.NVarChar, -1)
        {
            Value = Truncate(errorMessage, 4000),
        });
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task InvalidateDeviceRegistrationAsync(int deviceRegistrationId, string reason, CancellationToken cancellationToken)
    {
        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText =
            """
            UPDATE [Messaging].[DeviceRegistration]
            SET [isActive] = 0,
                [invalidatedAt] = COALESCE([invalidatedAt], SYSUTCDATETIME()),
                [invalidReason] = @Reason
            WHERE [id] = @DeviceRegistrationId;
            """;
        command.Parameters.Add(new SqlParameter("@DeviceRegistrationId", System.Data.SqlDbType.Int) { Value = deviceRegistrationId });
        command.Parameters.Add(new SqlParameter("@Reason", System.Data.SqlDbType.NVarChar, 200)
        {
            Value = Truncate(reason, 200),
        });
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task FinalizeNotificationAsync(long notificationId, int maxAttempts, CancellationToken cancellationToken)
    {
        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText =
            """
            ;WITH totals AS (
                SELECT
                    CAST(COUNT_BIG(1) AS INT) AS [requestedCount],
                    CAST(SUM(CASE WHEN [status] = N'sent' THEN 1 ELSE 0 END) AS INT) AS [successCount],
                    CAST(SUM(CASE WHEN [status] = N'failed' THEN 1 ELSE 0 END) AS INT) AS [failureCount],
                    CAST(SUM(CASE
                        WHEN [status] IN (N'pending', N'sending') THEN 1
                        WHEN [status] = N'failed'
                            AND [attemptCount] < @MaxAttempts
                            AND [errorCode] IN (N'fcm-unavailable', N'fcm-internal', N'fcm-quota-exceeded')
                        THEN 1
                        ELSE 0
                    END) AS INT) AS [inFlightCount]
                FROM [Messaging].[NotificationDelivery]
                WHERE [notificationId] = @NotificationId
            )
            UPDATE n
            SET [requestedCount] = COALESCE(t.[requestedCount], 0),
                [successCount] = COALESCE(t.[successCount], 0),
                [failureCount] = COALESCE(t.[failureCount], 0),
                [completedAt] = CASE
                    WHEN COALESCE(t.[inFlightCount], 0) = 0 THEN SYSUTCDATETIME()
                    ELSE NULL
                END,
                [status] = CASE
                    WHEN COALESCE(t.[inFlightCount], 0) > 0 THEN N'processing'
                    WHEN COALESCE(t.[requestedCount], 0) = 0 THEN N'no-targets'
                    WHEN COALESCE(t.[failureCount], 0) = 0 THEN N'sent'
                    WHEN COALESCE(t.[successCount], 0) = 0 THEN N'failed'
                    ELSE N'partial'
                END,
                [errorMessage] = CASE
                    WHEN COALESCE(t.[requestedCount], 0) = 0 THEN N'No eligible active device registrations found for this notification.'
                    WHEN COALESCE(t.[failureCount], 0) = 0 THEN NULL
                    ELSE n.[errorMessage]
                END
            FROM [Messaging].[Notification] n
            CROSS JOIN totals t
            WHERE n.[id] = @NotificationId;
            """;
        command.Parameters.Add(new SqlParameter("@NotificationId", System.Data.SqlDbType.BigInt) { Value = notificationId });
        command.Parameters.Add(new SqlParameter("@MaxAttempts", System.Data.SqlDbType.Int) { Value = Math.Max(1, maxAttempts) });
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task FailNotificationAsync(long notificationId, string errorMessage, CancellationToken cancellationToken)
    {
        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText =
            """
            ;WITH totals AS (
                SELECT
                    CAST(COUNT_BIG(1) AS INT) AS [requestedCount],
                    CAST(SUM(CASE WHEN [status] = N'sent' THEN 1 ELSE 0 END) AS INT) AS [successCount]
                FROM [Messaging].[NotificationDelivery]
                WHERE [notificationId] = @NotificationId
            )
            UPDATE n
            SET [requestedCount] = COALESCE(t.[requestedCount], 0),
                [successCount] = COALESCE(t.[successCount], 0),
                [failureCount] = COALESCE(t.[requestedCount], 0) - COALESCE(t.[successCount], 0),
                [status] = N'failed',
                [completedAt] = SYSUTCDATETIME(),
                [errorMessage] = @ErrorMessage
            FROM [Messaging].[Notification] n
            CROSS JOIN totals t
            WHERE n.[id] = @NotificationId;
            """;
        command.Parameters.Add(new SqlParameter("@NotificationId", System.Data.SqlDbType.BigInt) { Value = notificationId });
        command.Parameters.Add(new SqlParameter("@ErrorMessage", System.Data.SqlDbType.NVarChar, -1)
        {
            Value = Truncate(errorMessage, 4000),
        });
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private async Task<SqlConnection> OpenConnectionAsync(CancellationToken cancellationToken)
    {
        var connectionString = databaseOptions.CurrentValue.ConnectionString;
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("DATABASE_URL or SQL connection string is not configured.");
        }

        var connection = new SqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        return connection;
    }

    private static string Truncate(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        return value.Length <= maxLength ? value : value[..maxLength];
    }
}
