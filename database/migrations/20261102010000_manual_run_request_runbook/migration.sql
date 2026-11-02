IF COL_LENGTH(N'[Taskling].[ManualRunRequest]', N'runbook') IS NULL
BEGIN
  ALTER TABLE [Taskling].[ManualRunRequest]
  ADD [runbook] NVARCHAR(50) NOT NULL
  CONSTRAINT [ManualRunRequest_runbook_df] DEFAULT N'all';
END;
