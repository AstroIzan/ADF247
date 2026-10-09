using System.Text.Json;
using ADF247.Messaging.Worker.Configuration;

namespace ADF247.Messaging.Worker.Services;

public sealed class JsonMessagingRunbookProvider(string runbookPath) : IMessagingRunbookProvider
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly object _sync = new();
    private readonly string _runbookPath = Path.GetFullPath(runbookPath);
    private MessagingRunbookSnapshot _snapshot = new(
        new MessagingWorkerOptions(),
        new MessagingRunbookOptions(),
        IsStale: true,
        LoadedAtUtc: DateTimeOffset.MinValue,
        Warning: "Runbook not loaded yet.");
    private DateTime _lastWriteUtc = DateTime.MinValue;

    public MessagingRunbookSnapshot GetSnapshot()
    {
        lock (_sync)
        {
            var fileInfo = new FileInfo(_runbookPath);
            if (!fileInfo.Exists)
            {
                return _snapshot with
                {
                    IsStale = true,
                    Warning = $"Runbook file not found at '{_runbookPath}'. Using last known configuration.",
                };
            }

            if (fileInfo.LastWriteTimeUtc <= _lastWriteUtc && _snapshot.LoadedAtUtc != DateTimeOffset.MinValue)
            {
                return _snapshot;
            }

            try
            {
                using var stream = new FileStream(_runbookPath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
                var document = JsonSerializer.Deserialize<MessagingRunbookDocument>(stream, SerializerOptions) ?? new MessagingRunbookDocument();
                document.MessagingRunbook.Campaigns ??= [];

                _snapshot = new MessagingRunbookSnapshot(
                    document.MessagingWorker,
                    document.MessagingRunbook,
                    IsStale: false,
                    LoadedAtUtc: DateTimeOffset.UtcNow,
                    Warning: null);
                _lastWriteUtc = fileInfo.LastWriteTimeUtc;
            }
            catch (Exception exception)
            {
                _snapshot = _snapshot with
                {
                    IsStale = true,
                    Warning = $"Invalid runbook content at '{_runbookPath}': {exception.Message}. Using last known configuration.",
                };
            }

            return _snapshot;
        }
    }
}
