using System.Globalization;
using System.Text.Json;
using ADF247.Messaging.Worker.Configuration;
using FirebaseAdmin.Messaging;
using Microsoft.Extensions.Options;

namespace ADF247.Messaging.Worker.Services;

public sealed class MessagingOrchestrationWorker(
    IMessagingReadinessProbe readinessProbe,
    IMessagingRunbookProvider runbookProvider,
    INotificationDispatchRepository repository,
    IFirebaseNotificationSender firebaseSender,
    IOptionsMonitor<MessagingWorkerOptions> configuredWorkerOptions,
    ILogger<MessagingOrchestrationWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Messaging worker started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            var pollInterval = TimeSpan.FromSeconds(30);

            try
            {
                var runbookSnapshot = runbookProvider.GetSnapshot();
                var effectiveWorkerOptions = BuildEffectiveWorkerOptions(runbookSnapshot.Worker);
                pollInterval = TimeSpan.FromSeconds(Math.Max(5, effectiveWorkerOptions.PollingIntervalSeconds));

                if (runbookSnapshot.IsStale && !string.IsNullOrWhiteSpace(runbookSnapshot.Warning))
                {
                    logger.LogWarning("{RunbookWarning}", runbookSnapshot.Warning);
                }

                var localNow = DateTimeOffset.Now;
                var localMinute = new DateTimeOffset(
                    localNow.Year,
                    localNow.Month,
                    localNow.Day,
                    localNow.Hour,
                    localNow.Minute,
                    0,
                    localNow.Offset);

                var invalidCampaigns = FindInvalidCampaigns(runbookSnapshot.Runbook).ToArray();
                var readiness = await readinessProbe.CheckAsync(stoppingToken);
                if (!readiness.IsReady)
                {
                    logger.LogWarning(
                        "Messaging worker not ready: {Reason}. Enabled campaigns: {EnabledCampaigns}. Invalid campaigns: {InvalidCampaigns}.",
                        readiness.Reason,
                        runbookSnapshot.Runbook.Campaigns.Count(campaign => campaign.Enabled),
                        invalidCampaigns.Length);
                }
                else
                {
                    logger.LogInformation(
                        "Messaging worker ready. Enabled campaigns: {EnabledCampaigns}. Invalid campaigns: {InvalidCampaigns}.",
                        runbookSnapshot.Runbook.Campaigns.Count(campaign => campaign.Enabled),
                        invalidCampaigns.Length);

                    await ProcessRunbookSchedulesAsync(runbookSnapshot.Runbook, localMinute, stoppingToken);
                    await ProcessQueuedNotificationsAsync(effectiveWorkerOptions, stoppingToken);
                }

                if (invalidCampaigns.Length > 0)
                {
                    logger.LogWarning("Runbook campaigns with invalid cron schedules: {CampaignIds}", invalidCampaigns);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Unexpected failure in messaging worker polling loop.");
            }

            await Task.Delay(pollInterval, stoppingToken);
        }

        logger.LogInformation("Messaging worker stopping.");
    }

    private async Task ProcessRunbookSchedulesAsync(
        MessagingRunbookOptions runbook,
        DateTimeOffset localMinute,
        CancellationToken cancellationToken)
    {
        foreach (var campaign in runbook.Campaigns.Where(campaign => campaign.Enabled))
        {
            if (!SixFieldCron.TryParse(campaign.Cron, out var schedule) || !schedule.IsMatch(localMinute))
            {
                continue;
            }

            var startDetails = JsonSerializer.Serialize(new
            {
                runbookKey = campaign.Id,
                runbookName = campaign.Name,
                cron = campaign.Cron,
                localMinute = localMinute.ToString("yyyy-MM-ddTHH:mm:sszzz", CultureInfo.InvariantCulture),
                template = campaign.Template,
                channel = campaign.Channel,
            });

            var startResult = await repository.TryStartRunbookExecutionAsync(
                runbookKey: campaign.Id,
                trigger: "scheduled",
                localMinute: localMinute,
                detailsJson: startDetails,
                cancellationToken: cancellationToken);

            if (!startResult.ShouldRun || !startResult.ExecutionId.HasValue)
            {
                continue;
            }

            var executionId = startResult.ExecutionId.Value;

            try
            {
                var payloadJson = JsonSerializer.Serialize(new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["runbookKey"] = campaign.Id,
                    ["runbookName"] = campaign.Name,
                    ["runbookCron"] = campaign.Cron,
                    ["runbookLocalMinute"] = localMinute.ToString("yyyy-MM-ddTHH:mm:sszzz", CultureInfo.InvariantCulture),
                    ["dispatchBehavior"] = "broadcast-all-devices",
                    ["notificationTrigger"] = $"runbook:{campaign.Id}",
                    ["channel"] = campaign.Channel,
                    ["template"] = campaign.Template,
                });

                var queueResult = await repository.QueueNotificationFromConfigurationAsync(
                    runbookKey: campaign.Id,
                    templateKey: campaign.Template,
                    notificationTrigger: $"runbook:{campaign.Id}",
                    payloadJson: payloadJson,
                    cancellationToken: cancellationToken);

                var completionDetails = JsonSerializer.Serialize(new
                {
                    runbookKey = campaign.Id,
                    runbookName = campaign.Name,
                    cron = campaign.Cron,
                    localMinute = localMinute.ToString("yyyy-MM-ddTHH:mm:sszzz", CultureInfo.InvariantCulture),
                    template = campaign.Template,
                    channel = campaign.Channel,
                    queueResult.NotificationQueued,
                    queueResult.NotificationId,
                    queueResult.Status,
                    queueResult.Message,
                });

                var status = queueResult.NotificationQueued
                    ? "succeeded"
                    : queueResult.Status.Equals("failed", StringComparison.OrdinalIgnoreCase) ? "failed" : "skipped";

                await repository.CompleteRunbookExecutionAsync(
                    executionId: executionId,
                    status: status,
                    detailsJson: completionDetails,
                    errorMessage: status == "failed" ? queueResult.Message : null,
                    cancellationToken: cancellationToken);

                if (!queueResult.NotificationQueued)
                {
                    logger.LogWarning(
                        "Runbook {RunbookKey} did not queue a notification. Status: {Status}. Reason: {Message}.",
                        campaign.Id,
                        queueResult.Status,
                        queueResult.Message);
                }
            }
            catch (Exception exception)
            {
                await repository.CompleteRunbookExecutionAsync(
                    executionId: executionId,
                    status: "failed",
                    detailsJson: startDetails,
                    errorMessage: exception.Message,
                    cancellationToken: cancellationToken);
                logger.LogError(exception, "Runbook execution failed for {RunbookKey}.", campaign.Id);
            }
        }
    }

    private async Task ProcessQueuedNotificationsAsync(MessagingWorkerOptions workerOptions, CancellationToken cancellationToken)
    {
        var claimedNotifications = await repository.ClaimQueuedNotificationsAsync(workerOptions.NotificationClaimBatchSize, cancellationToken);
        if (claimedNotifications.Count == 0)
        {
            return;
        }

        logger.LogInformation("Claimed {NotificationCount} queued notification(s) for processing.", claimedNotifications.Count);

        foreach (var notification in claimedNotifications)
        {
            try
            {
                var payload = ParsePayload(notification.PayloadJson);
                var recipientSelection = ResolveRecipientSelection(notification, payload);
                var taggedPayload = TagPayload(payload, notification.Trigger, recipientSelection.Tag);
                var createdDeliveries = await repository.EnsureNotificationDeliveriesAsync(
                    notification.Id,
                    notification.ConvocatoriaId,
                    recipientSelection.Behavior,
                    cancellationToken);
                var requeuedDeliveries = await repository.RequeueRetryableDeliveriesAsync(
                    notification.Id,
                    workerOptions.MaxDeliveryAttempts,
                    cancellationToken);
                logger.LogInformation(
                    "Processing notification {NotificationId} (trigger: {Trigger}, selection: {SelectionTag}). Created delivery rows: {CreatedDeliveries}. Requeued deliveries: {RequeuedDeliveries}.",
                    notification.Id,
                    notification.Trigger,
                    recipientSelection.Tag,
                    createdDeliveries,
                    requeuedDeliveries);

                await ProcessNotificationDeliveriesAsync(notification, taggedPayload, workerOptions.DeliveryClaimBatchSize, cancellationToken);
                await repository.MarkInactivePendingDeliveriesFailedAsync(notification.Id, cancellationToken);
                await repository.FinalizeNotificationAsync(notification.Id, workerOptions.MaxDeliveryAttempts, cancellationToken);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Failed to process notification {NotificationId}.", notification.Id);
                await repository.FailNotificationAsync(notification.Id, exception.Message, cancellationToken);
            }
        }
    }

    private async Task ProcessNotificationDeliveriesAsync(
        ClaimedNotification notification,
        IReadOnlyDictionary<string, string> payload,
        int batchSize,
        CancellationToken cancellationToken)
    {
        var effectiveBatchSize = Math.Max(1, batchSize);

        while (true)
        {
            var deliveries = await repository.ClaimPendingDeliveriesAsync(notification.Id, effectiveBatchSize, cancellationToken);
            if (deliveries.Count == 0)
            {
                return;
            }

            foreach (var delivery in deliveries)
            {
                try
                {
                    await firebaseSender.SendAsync(
                        delivery.Token,
                        notification.Title,
                        notification.Body,
                        payload,
                        cancellationToken);
                    await repository.MarkDeliverySentAsync(delivery.Id, cancellationToken);
                }
                catch (FirebaseMessagingException exception)
                {
                    if (IsExplicitInvalidToken(exception))
                    {
                        await repository.InvalidateDeviceRegistrationAsync(
                            delivery.DeviceRegistrationId,
                            "fcm-invalid-registration-token",
                            cancellationToken);
                    }

                    await repository.MarkDeliveryFailedAsync(
                        delivery.Id,
                        IsRetryableFcmFailure(exception) ? GetRetryableErrorCode(exception) : GetErrorCode(exception),
                        exception.Message,
                        cancellationToken);
                }
                catch (Exception exception)
                {
                    await repository.MarkDeliveryFailedAsync(
                        delivery.Id,
                        "unexpected-error",
                        exception.Message,
                        cancellationToken);
                }
            }
        }
    }

    private MessagingWorkerOptions BuildEffectiveWorkerOptions(MessagingWorkerOptions runbookWorkerOptions)
    {
        var fallback = configuredWorkerOptions.CurrentValue;
        return new MessagingWorkerOptions
        {
            PollingIntervalSeconds = ChoosePositive(runbookWorkerOptions.PollingIntervalSeconds, fallback.PollingIntervalSeconds, 30),
            NotificationClaimBatchSize = ChoosePositive(runbookWorkerOptions.NotificationClaimBatchSize, fallback.NotificationClaimBatchSize, 10),
            DeliveryClaimBatchSize = ChoosePositive(runbookWorkerOptions.DeliveryClaimBatchSize, fallback.DeliveryClaimBatchSize, 200),
            MaxDeliveryAttempts = ChoosePositive(runbookWorkerOptions.MaxDeliveryAttempts, fallback.MaxDeliveryAttempts, 3),
        };
    }

    private static int ChoosePositive(params int[] values)
    {
        foreach (var value in values)
        {
            if (value > 0)
            {
                return value;
            }
        }

        return 1;
    }

    private NotificationRecipientSelection ResolveRecipientSelection(
        ClaimedNotification notification,
        IReadOnlyDictionary<string, string> payload)
    {
        if (!notification.ConvocatoriaId.HasValue)
        {
            return new NotificationRecipientSelection(
                RecipientSelectionBehavior.BroadcastAllDevices,
                "broadcast-all-devices");
        }

        var hints = CollectSelectionHints(notification.Trigger, payload);
        if (hints.Any(hint => hint.Contains("response-request", StringComparison.OrdinalIgnoreCase)
            || hint.Contains("pending-response", StringComparison.OrdinalIgnoreCase)))
        {
            return new NotificationRecipientSelection(
                RecipientSelectionBehavior.ConvocatoriaResponseRequest,
                "convocatoria-response-request-no-response");
        }

        if (hints.Any(hint => hint.Contains("sortida-status", StringComparison.OrdinalIgnoreCase)
            || hint.Contains("sortida-confirmed", StringComparison.OrdinalIgnoreCase)))
        {
            return new NotificationRecipientSelection(
                RecipientSelectionBehavior.ConvocatoriaSortidaStatus,
                "convocatoria-sortida-status-affirmative");
        }

        return new NotificationRecipientSelection(
            RecipientSelectionBehavior.BroadcastAllDevices,
            "convocatoria-broadcast-by-trigger");
    }

    private static IEnumerable<string> CollectSelectionHints(
        string trigger,
        IReadOnlyDictionary<string, string> payload)
    {
        if (!string.IsNullOrWhiteSpace(trigger))
        {
            yield return trigger;
        }

        var keys = new[]
        {
            "dispatchBehavior",
            "notificationBehavior",
            "audienceBehavior",
            "kind",
            "dataKind",
            "action",
        };

        foreach (var key in keys)
        {
            if (payload.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value))
            {
                yield return value;
            }
        }
    }

    private static IReadOnlyDictionary<string, string> TagPayload(
        IReadOnlyDictionary<string, string> payload,
        string trigger,
        string selectionTag)
    {
        var tagged = new Dictionary<string, string>(payload, StringComparer.OrdinalIgnoreCase)
        {
            ["dispatchBehavior"] = selectionTag,
        };
        if (!string.IsNullOrWhiteSpace(trigger))
        {
            tagged["notificationTrigger"] = trigger;
        }

        return tagged;
    }

    private IReadOnlyDictionary<string, string> ParsePayload(string? payloadJson)
    {
        if (string.IsNullOrWhiteSpace(payloadJson))
        {
            return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        }

        try
        {
            using var document = JsonDocument.Parse(payloadJson);
            if (document.RootElement.ValueKind != JsonValueKind.Object)
            {
                return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            }

            var data = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (var property in document.RootElement.EnumerateObject())
            {
                data[property.Name] = JsonValueToString(property.Value);
            }

            return data;
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Invalid notification payload JSON. Notification will be sent without extra data.");
            return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        }
    }

    private static string JsonValueToString(JsonElement element) =>
        element.ValueKind switch
        {
            JsonValueKind.String => element.GetString() ?? string.Empty,
            JsonValueKind.Number => element.GetRawText(),
            JsonValueKind.True => bool.TrueString.ToLowerInvariant(),
            JsonValueKind.False => bool.FalseString.ToLowerInvariant(),
            JsonValueKind.Null => string.Empty,
            JsonValueKind.Undefined => string.Empty,
            _ => element.GetRawText(),
        };

    private static bool IsExplicitInvalidToken(FirebaseMessagingException exception)
    {
        if (exception.MessagingErrorCode == MessagingErrorCode.Unregistered)
        {
            return true;
        }

        if (exception.MessagingErrorCode != MessagingErrorCode.InvalidArgument)
        {
            return false;
        }

        var message = exception.Message ?? string.Empty;
        return message.Contains("registration token", StringComparison.OrdinalIgnoreCase)
            || message.Contains("not a valid fcm registration token", StringComparison.OrdinalIgnoreCase)
            || message.Contains("registration-token-not-registered", StringComparison.OrdinalIgnoreCase);
    }

    private static string GetErrorCode(FirebaseMessagingException exception) =>
        exception.MessagingErrorCode switch
        {
            MessagingErrorCode.Unregistered => "fcm-unregistered",
            MessagingErrorCode.InvalidArgument => "fcm-invalid-argument",
            MessagingErrorCode.QuotaExceeded => "fcm-quota-exceeded",
            MessagingErrorCode.SenderIdMismatch => "fcm-sender-id-mismatch",
            MessagingErrorCode.Unavailable => "fcm-unavailable",
            _ => $"fcm-{(exception.MessagingErrorCode?.ToString() ?? "unknown").ToLower(CultureInfo.InvariantCulture)}",
        };

    private static bool IsRetryableFcmFailure(FirebaseMessagingException exception)
    {
        var code = exception.MessagingErrorCode?.ToString();
        return string.Equals(code, "Unavailable", StringComparison.OrdinalIgnoreCase)
            || string.Equals(code, "Internal", StringComparison.OrdinalIgnoreCase)
            || string.Equals(code, "QuotaExceeded", StringComparison.OrdinalIgnoreCase);
    }

    private static string GetRetryableErrorCode(FirebaseMessagingException exception)
    {
        var code = exception.MessagingErrorCode?.ToString();
        if (string.Equals(code, "Unavailable", StringComparison.OrdinalIgnoreCase))
        {
            return "fcm-unavailable";
        }

        if (string.Equals(code, "Internal", StringComparison.OrdinalIgnoreCase))
        {
            return "fcm-internal";
        }

        if (string.Equals(code, "QuotaExceeded", StringComparison.OrdinalIgnoreCase))
        {
            return "fcm-quota-exceeded";
        }

        return GetErrorCode(exception);
    }

    private static IEnumerable<string> FindInvalidCampaigns(MessagingRunbookOptions runbook)
    {
        foreach (var campaign in runbook.Campaigns)
        {
            if (!SixFieldCron.TryParse(campaign.Cron, out _))
            {
                yield return string.IsNullOrWhiteSpace(campaign.Id) ? "(missing-id)" : campaign.Id;
            }
        }
    }
}

internal sealed class SixFieldCron
{
    private readonly CronField _seconds;
    private readonly CronField _minutes;
    private readonly CronField _hours;
    private readonly CronField _daysOfMonth;
    private readonly CronField _months;
    private readonly CronField _daysOfWeek;

    private SixFieldCron(
        CronField seconds,
        CronField minutes,
        CronField hours,
        CronField daysOfMonth,
        CronField months,
        CronField daysOfWeek)
    {
        _seconds = seconds;
        _minutes = minutes;
        _hours = hours;
        _daysOfMonth = daysOfMonth;
        _months = months;
        _daysOfWeek = daysOfWeek;
    }

    public bool IsMatch(DateTimeOffset value)
    {
        var weekday = value.DayOfWeek == DayOfWeek.Sunday ? 0 : (int)value.DayOfWeek;
        return _seconds.Matches(value.Second)
            && _minutes.Matches(value.Minute)
            && _hours.Matches(value.Hour)
            && _daysOfMonth.Matches(value.Day)
            && _months.Matches(value.Month)
            && _daysOfWeek.Matches(weekday);
    }

    public static bool TryParse(string? expression, out SixFieldCron cron)
    {
        cron = null!;
        if (string.IsNullOrWhiteSpace(expression))
        {
            return false;
        }

        var parts = expression.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length != 6)
        {
            return false;
        }

        if (!CronField.TryParse(parts[0], 0, 59, null, out var seconds)
            || !CronField.TryParse(parts[1], 0, 59, null, out var minutes)
            || !CronField.TryParse(parts[2], 0, 23, null, out var hours)
            || !CronField.TryParse(parts[3], 1, 31, null, out var daysOfMonth)
            || !CronField.TryParse(parts[4], 1, 12, MonthAliases, out var months)
            || !CronField.TryParse(parts[5], 0, 7, DayAliases, out var daysOfWeek))
        {
            return false;
        }

        cron = new SixFieldCron(seconds, minutes, hours, daysOfMonth, months, daysOfWeek);
        return true;
    }

    private static readonly Dictionary<string, int> MonthAliases = new(StringComparer.OrdinalIgnoreCase)
    {
        ["JAN"] = 1, ["FEB"] = 2, ["MAR"] = 3, ["APR"] = 4, ["MAY"] = 5, ["JUN"] = 6,
        ["JUL"] = 7, ["AUG"] = 8, ["SEP"] = 9, ["OCT"] = 10, ["NOV"] = 11, ["DEC"] = 12,
    };

    private static readonly Dictionary<string, int> DayAliases = new(StringComparer.OrdinalIgnoreCase)
    {
        ["SUN"] = 0, ["MON"] = 1, ["TUE"] = 2, ["WED"] = 3, ["THU"] = 4, ["FRI"] = 5, ["SAT"] = 6,
    };
}

internal sealed class CronField
{
    private readonly HashSet<int>? _allowed;
    private readonly bool _allowAny;

    private CronField(bool allowAny, HashSet<int>? allowed)
    {
        _allowAny = allowAny;
        _allowed = allowed;
    }

    public bool Matches(int value) => _allowAny || (_allowed?.Contains(value) ?? false);

    public static bool TryParse(
        string token,
        int min,
        int max,
        IReadOnlyDictionary<string, int>? aliases,
        out CronField field)
    {
        field = null!;
        if (string.IsNullOrWhiteSpace(token))
        {
            return false;
        }

        if (token is "*" or "?")
        {
            field = new CronField(allowAny: true, allowed: null);
            return true;
        }

        var values = new HashSet<int>();
        var parts = token.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        foreach (var part in parts)
        {
            if (!TryExpandPart(part, min, max, aliases, values))
            {
                return false;
            }
        }

        field = new CronField(allowAny: false, values);
        return values.Count > 0;
    }

    private static bool TryExpandPart(
        string part,
        int min,
        int max,
        IReadOnlyDictionary<string, int>? aliases,
        HashSet<int> values)
    {
        if (string.IsNullOrWhiteSpace(part))
        {
            return false;
        }

        var rangeSection = part;
        var step = 1;
        var slashIndex = part.IndexOf('/');
        if (slashIndex >= 0)
        {
            rangeSection = part[..slashIndex];
            var stepToken = part[(slashIndex + 1)..];
            if (!int.TryParse(stepToken, NumberStyles.Integer, CultureInfo.InvariantCulture, out step) || step <= 0)
            {
                return false;
            }
        }

        int rangeStart;
        int rangeEnd;

        if (rangeSection == "*" || rangeSection == "?")
        {
            rangeStart = min;
            rangeEnd = max;
        }
        else
        {
            var dashIndex = rangeSection.IndexOf('-');
            if (dashIndex >= 0)
            {
                if (!TryResolveValue(rangeSection[..dashIndex], aliases, out rangeStart)
                    || !TryResolveValue(rangeSection[(dashIndex + 1)..], aliases, out rangeEnd))
                {
                    return false;
                }
            }
            else
            {
                if (!TryResolveValue(rangeSection, aliases, out rangeStart))
                {
                    return false;
                }

                rangeEnd = rangeStart;
            }
        }

        if (rangeStart > rangeEnd)
        {
            return false;
        }

        if (rangeStart < min || rangeEnd > max)
        {
            return false;
        }

        for (var value = rangeStart; value <= rangeEnd; value += step)
        {
            if (max == 7 && value == 7)
            {
                values.Add(0);
            }
            else
            {
                values.Add(value);
            }
        }

        return true;
    }

    private static bool TryResolveValue(string token, IReadOnlyDictionary<string, int>? aliases, out int value)
    {
        token = token.Trim();
        if (aliases is not null && aliases.TryGetValue(token, out value))
        {
            return true;
        }

        return int.TryParse(token, NumberStyles.Integer, CultureInfo.InvariantCulture, out value);
    }
}
