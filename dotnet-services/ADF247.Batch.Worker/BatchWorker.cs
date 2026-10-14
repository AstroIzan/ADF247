namespace ADF247.Batch.Worker;

public sealed class BatchWorker(ILogger<BatchWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Batch worker started. No batch jobs are configured yet.");

        try
        {
            await Task.Delay(Timeout.InfiniteTimeSpan, stoppingToken);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            logger.LogInformation("Batch worker stopping.");
        }
    }
}
