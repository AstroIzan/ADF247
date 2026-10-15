CREATE TABLE [Taskling].[ManualRunRequest] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [requestedByNCarnet] NVARCHAR(50) NOT NULL,
    [requestedAt] DATETIME2 NOT NULL CONSTRAINT [ManualRunRequest_requestedAt_df] DEFAULT sysutcdatetime(),
    [processedAt] DATETIME2 NULL,
    [errorMessage] NVARCHAR(max) NULL,
    CONSTRAINT [ManualRunRequest_pkey] PRIMARY KEY CLUSTERED ([id])
);

CREATE INDEX [ManualRunRequest_processedAt_requestedAt_idx]
ON [Taskling].[ManualRunRequest] ([processedAt], [requestedAt]);
