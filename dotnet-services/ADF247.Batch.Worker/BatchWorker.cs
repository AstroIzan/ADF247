using ADF247.Batch.Worker.Services;

namespace ADF247.Batch.Worker;

public sealed class BatchWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<BatchWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Batch worker started.");
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var orchestrator = scope.ServiceProvider.GetRequiredService<BatchOrchestrator>();
                await orchestrator.RunDueJobsAsync(DateTimeOffset.UtcNow, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Unexpected failure in batch worker polling loop.");
            }

            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }

        logger.LogInformation("Batch worker stopping.");
    }
}
