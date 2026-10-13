BEGIN TRY
BEGIN TRAN;

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'Taskling') EXEC(N'CREATE SCHEMA [Taskling]');

CREATE TABLE [Taskling].[TaskDefinition] (
  [taskDefinitionId] INT IDENTITY(1,1) NOT NULL CONSTRAINT [Taskling_TaskDefinition_pkey] PRIMARY KEY,
  [name] NVARCHAR(200) NOT NULL,
  [createdAt] DATETIME2 NOT NULL CONSTRAINT [Taskling_TaskDefinition_createdAt_df] DEFAULT SYSUTCDATETIME(),
  CONSTRAINT [Taskling_TaskDefinition_name_key] UNIQUE ([name])
);

CREATE TABLE [Taskling].[TaskExecution] (
  [taskExecutionId] BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT [Taskling_TaskExecution_pkey] PRIMARY KEY,
  [taskDefinitionId] INT NOT NULL,
  [startedAt] DATETIME2 NOT NULL CONSTRAINT [Taskling_TaskExecution_startedAt_df] DEFAULT SYSUTCDATETIME(),
  [finishedAt] DATETIME2 NULL,
  [lastKeepAlive] DATETIME2 NOT NULL CONSTRAINT [Taskling_TaskExecution_lastKeepAlive_df] DEFAULT SYSUTCDATETIME(),
  [finalStatus] NVARCHAR(30) NULL,
  CONSTRAINT [Taskling_TaskExecution_definition_fkey]
    FOREIGN KEY ([taskDefinitionId]) REFERENCES [Taskling].[TaskDefinition]([taskDefinitionId]) ON DELETE CASCADE,
  CONSTRAINT [Taskling_TaskExecution_finalStatus_chk]
    CHECK ([finalStatus] IS NULL OR [finalStatus] IN (N'succeeded', N'failed', N'skipped', N'cancelled'))
);
CREATE INDEX [Taskling_TaskExecution_definition_started_idx]
  ON [Taskling].[TaskExecution]([taskDefinitionId], [startedAt] DESC);

CREATE TABLE [Taskling].[TaskExecutionDetail] (
  [taskExecutionDetailId] BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT [Taskling_TaskExecutionDetail_pkey] PRIMARY KEY,
  [taskExecutionId] BIGINT NOT NULL,
  [eventType] TINYINT NOT NULL,
  [occurredAt] DATETIME2 NOT NULL CONSTRAINT [Taskling_TaskExecutionDetail_occurredAt_df] DEFAULT SYSUTCDATETIME(),
  [message] NVARCHAR(MAX) NOT NULL,
  [detailsJson] NVARCHAR(MAX) NULL,
  CONSTRAINT [Taskling_TaskExecutionDetail_execution_fkey]
    FOREIGN KEY ([taskExecutionId]) REFERENCES [Taskling].[TaskExecution]([taskExecutionId]) ON DELETE CASCADE,
  CONSTRAINT [Taskling_TaskExecutionDetail_eventType_chk] CHECK ([eventType] BETWEEN 1 AND 5)
);
CREATE INDEX [Taskling_TaskExecutionDetail_execution_occurred_idx]
  ON [Taskling].[TaskExecutionDetail]([taskExecutionId], [occurredAt]);

IF OBJECT_ID(N'[Messaging].[RunbookExecution]', N'U') IS NOT NULL
BEGIN
  INSERT INTO [Taskling].[TaskDefinition] ([name])
  SELECT DISTINCT [runbookKey]
  FROM [Messaging].[RunbookExecution] source
  WHERE NOT EXISTS (
    SELECT 1 FROM [Taskling].[TaskDefinition] target WHERE target.[name] = source.[runbookKey]
  );

  INSERT INTO [Taskling].[TaskExecution] (
    [taskDefinitionId], [startedAt], [finishedAt], [lastKeepAlive], [finalStatus]
  )
  SELECT
    definition.[taskDefinitionId],
    run.[startedAt],
    run.[finishedAt],
    COALESCE(run.[finishedAt], run.[startedAt]),
    CASE WHEN run.[status] IN (N'succeeded', N'failed', N'skipped', N'cancelled') THEN run.[status] ELSE NULL END
  FROM [Messaging].[RunbookExecution] run
  INNER JOIN [Taskling].[TaskDefinition] definition ON definition.[name] = run.[runbookKey];

  DROP TABLE [Messaging].[RunbookExecution];
END;

IF OBJECT_ID(N'[dbo].[NotificationAutomationTaskRun]', N'U') IS NOT NULL DROP TABLE [dbo].[NotificationAutomationTaskRun];
IF OBJECT_ID(N'[dbo].[NotificationAutomationRun]', N'U') IS NOT NULL DROP TABLE [dbo].[NotificationAutomationRun];
IF OBJECT_ID(N'[dbo].[NotificationLog]', N'U') IS NOT NULL DROP TABLE [dbo].[NotificationLog];

COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH;
