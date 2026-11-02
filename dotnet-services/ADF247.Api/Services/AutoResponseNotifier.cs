using System.Text.Json;
using ADF247.Api.Data;
using ADF247.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ADF247.Api.Services;

public static class AutoResponseNotifier
{
    public const string Trigger = "auto-response";
    public const string Title = "Respostes automàtiques";
    public const string Body = "S'han respost de forma automàtica diferents convocatòries. Revisa que la resposta sigui correcta i la teva disponibilitat.";

    public static async Task<long?> QueueAsync(
        Adf247DbContext database,
        IEnumerable<string> carnets,
        CancellationToken cancellationToken = default)
    {
        var recipients = carnets.Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
        if (recipients.Length == 0)
            return null;

        var enabled = await database.SystemConfigurations
            .AsNoTracking()
            .Where(configuration => configuration.Id == 1)
            .Select(configuration => configuration.NotifyOnAutoAvailableResponse)
            .SingleOrDefaultAsync(cancellationToken);
        if (!enabled)
            return null;

        var notification = new MessagingNotification
        {
            Trigger = Trigger,
            Status = "queued",
            Title = Title,
            Body = Body,
            PayloadJson = JsonSerializer.Serialize(new Dictionary<string, string>
            {
                ["recipientNCarnets"] = string.Join(';', recipients),
                ["notificationTrigger"] = Trigger,
                ["dispatchBehavior"] = "explicit-recipients",
            }),
            RequestedCount = 0,
            SuccessCount = 0,
            FailureCount = 0,
            CreatedAt = DateTime.UtcNow,
        };
        database.MessagingNotifications.Add(notification);
        await database.SaveChangesAsync(cancellationToken);
        return notification.Id;
    }
}
