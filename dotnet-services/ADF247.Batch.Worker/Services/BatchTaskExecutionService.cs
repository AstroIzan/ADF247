using System.Data;
using System.Text.Json;
using ADF247.Api.Data;
using ADF247.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ADF247.Batch.Worker.Services;

public sealed class BatchTaskExecutionService(Adf247DbContext database)
{
    public async Task<long?> TryStartAsync(
        string taskName,
        DateTimeOffset localMinute,
        string message,
        object details,
        CancellationToken cancellationToken)
    {
        var minuteStart = new DateTimeOffset(
            localMinute.Year,
            localMinute.Month,
            localMinute.Day,
            localMinute.Hour,
            localMinute.Minute,
            0,
            localMinute.Offset);
        var startUtc = minuteStart.UtcDateTime;
        var endUtc = minuteStart.AddMinutes(1).UtcDateTime;

        await using var transaction = await database.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var definition = await database.TaskDefinitions.SingleOrDefaultAsync(
            item => item.Name == taskName,
            cancellationToken);
        if (definition is null)
        {
            definition = new TaskDefinition
            {
                Name = taskName,
                CreatedAt = DateTime.UtcNow,
            };
            database.TaskDefinitions.Add(definition);
            await database.SaveChangesAsync(cancellationToken);
        }

        var alreadyStarted = await database.TaskExecutions.AnyAsync(
            item => item.TaskDefinitionId == definition.TaskDefinitionId
                && item.StartedAt >= startUtc
                && item.StartedAt < endUtc,
            cancellationToken);
        if (alreadyStarted)
        {
            await transaction.CommitAsync(cancellationToken);
            return null;
        }

        var now = DateTime.UtcNow;
        var execution = new TaskExecution
        {
            TaskDefinitionId = definition.TaskDefinitionId,
            StartedAt = now,
            LastKeepAlive = now,
        };
        database.TaskExecutions.Add(execution);
        await database.SaveChangesAsync(cancellationToken);
        database.TaskExecutionDetails.Add(new TaskExecutionDetail
        {
            TaskExecutionId = execution.TaskExecutionId,
            EventType = (byte)BatchTaskEventType.Start,
            OccurredAt = now,
            Message = message,
            DetailsJson = JsonSerializer.Serialize(details),
        });
        await database.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return execution.TaskExecutionId;
    }

    public async Task AddDetailAsync(
        long executionId,
        BatchTaskEventType eventType,
        string message,
        object? details,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var execution = await database.TaskExecutions.SingleAsync(
            item => item.TaskExecutionId == executionId,
            cancellationToken);
        execution.LastKeepAlive = now;
        database.TaskExecutionDetails.Add(new TaskExecutionDetail
        {
            TaskExecutionId = executionId,
            EventType = (byte)eventType,
            OccurredAt = now,
            Message = message,
            DetailsJson = details is null ? null : JsonSerializer.Serialize(details),
        });
        await database.SaveChangesAsync(cancellationToken);
    }

    public async Task CompleteAsync(
        long executionId,
        string status,
        string message,
        object? details,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var execution = await database.TaskExecutions.SingleAsync(
            item => item.TaskExecutionId == executionId,
            cancellationToken);
        execution.LastKeepAlive = now;
        execution.FinishedAt = now;
        execution.FinalStatus = status;
        database.TaskExecutionDetails.Add(new TaskExecutionDetail
        {
            TaskExecutionId = executionId,
            EventType = (byte)BatchTaskEventType.End,
            OccurredAt = now,
            Message = message,
            DetailsJson = details is null ? null : JsonSerializer.Serialize(details),
        });
        await database.SaveChangesAsync(cancellationToken);
    }
}

public enum BatchTaskEventType : byte
{
    Start = 1,
    Info = 2,
    Error = 3,
    Warning = 4,
    End = 5,
}
