BEGIN TRY
BEGIN TRAN;

IF OBJECT_ID(N'[dbo].[ADF]', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[ADF] (
    [id] INT NOT NULL IDENTITY(1,1),
    [number] INT NOT NULL,
    [name] NVARCHAR(200) NOT NULL,
    [municipalities] NVARCHAR(max) NOT NULL CONSTRAINT [ADF_municipalities_df] DEFAULT N'[]',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ADF_createdAt_df] DEFAULT SYSUTCDATETIME(),
    [updatedAt] DATETIME2 NOT NULL CONSTRAINT [ADF_updatedAt_df] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [ADF_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ADF_number_key] UNIQUE NONCLUSTERED ([number])
  );
END;

IF NOT EXISTS (SELECT 1 FROM [dbo].[ADF] WHERE [number] = 247)
BEGIN
  DECLARE @municipalities NVARCHAR(max) = N'[]';
  IF OBJECT_ID(N'[PlaAlfa].[MunicipalitySelection]', N'U') IS NOT NULL
    SELECT @municipalities = COALESCE(
      N'[' + STRING_AGG(N'"' + STRING_ESCAPE([municipality], 'json') + N'"', N',') + N']',
      N'[]')
    FROM [PlaAlfa].[MunicipalitySelection];
  INSERT INTO [dbo].[ADF] ([number], [name], [municipalities]) VALUES (247, N'ADF 247', @municipalities);
END;

IF COL_LENGTH(N'[dbo].[Role]', N'isSecretariat') IS NULL
  ALTER TABLE [dbo].[Role] ADD [isSecretariat] BIT NOT NULL CONSTRAINT [Role_isSecretariat_df] DEFAULT 0;

IF COL_LENGTH(N'[dbo].[User]', N'adfId') IS NULL
BEGIN
  ALTER TABLE [dbo].[User] ADD [adfId] INT NULL;
  EXEC(N'UPDATE [dbo].[User] SET [adfId] = (SELECT [id] FROM [dbo].[ADF] WHERE [number] = 247)');
  ALTER TABLE [dbo].[User] ALTER COLUMN [adfId] INT NOT NULL;
  ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_adfId_fkey] FOREIGN KEY ([adfId]) REFERENCES [dbo].[ADF]([id]);
  EXEC(N'CREATE NONCLUSTERED INDEX [User_adfId_idx] ON [dbo].[User]([adfId])');
END;

IF COL_LENGTH(N'[dbo].[Convocatoria]', N'adfId') IS NULL
BEGIN
  ALTER TABLE [dbo].[Convocatoria] ADD [adfId] INT NULL;
  EXEC(N'UPDATE [dbo].[Convocatoria] SET [adfId] = (SELECT [id] FROM [dbo].[ADF] WHERE [number] = 247)');
  ALTER TABLE [dbo].[Convocatoria] ALTER COLUMN [adfId] INT NOT NULL;
  ALTER TABLE [dbo].[Convocatoria] ADD CONSTRAINT [Convocatoria_adfId_fkey] FOREIGN KEY ([adfId]) REFERENCES [dbo].[ADF]([id]);
  EXEC(N'CREATE NONCLUSTERED INDEX [Convocatoria_adfId_startTime_idx] ON [dbo].[Convocatoria]([adfId], [startTime])');
END;

IF COL_LENGTH(N'[dbo].[Respuesta]', N'adfId') IS NULL
BEGIN
  ALTER TABLE [dbo].[Respuesta] ADD [adfId] INT NULL;
  EXEC(N'UPDATE r SET r.[adfId] = c.[adfId] FROM [dbo].[Respuesta] r INNER JOIN [dbo].[Convocatoria] c ON c.[id] = r.[convoId]');
  ALTER TABLE [dbo].[Respuesta] ALTER COLUMN [adfId] INT NOT NULL;
  EXEC(N'CREATE NONCLUSTERED INDEX [Respuesta_adfId_convoId_idx] ON [dbo].[Respuesta]([adfId], [convoId])');
END;

IF COL_LENGTH(N'[PlaAlfa].[MunicipalitySelection]', N'adfId') IS NULL
BEGIN
  ALTER TABLE [PlaAlfa].[MunicipalitySelection] ADD [adfId] INT NULL;
  EXEC(N'UPDATE [PlaAlfa].[MunicipalitySelection] SET [adfId] = (SELECT [id] FROM [dbo].[ADF] WHERE [number] = 247)');
  ALTER TABLE [PlaAlfa].[MunicipalitySelection] ALTER COLUMN [adfId] INT NOT NULL;
  ALTER TABLE [PlaAlfa].[MunicipalitySelection] ADD CONSTRAINT [PlaAlfa_MunicipalitySelection_adfId_fkey] FOREIGN KEY ([adfId]) REFERENCES [dbo].[ADF]([id]);
  DROP INDEX [PlaAlfa_MunicipalitySelection_principal_key] ON [PlaAlfa].[MunicipalitySelection];
  ALTER TABLE [PlaAlfa].[MunicipalitySelection] DROP CONSTRAINT [PlaAlfa_MunicipalitySelection_pkey];
  ALTER TABLE [PlaAlfa].[MunicipalitySelection] ADD CONSTRAINT [PlaAlfa_MunicipalitySelection_pkey] PRIMARY KEY CLUSTERED ([adfId], [municipality]);
  EXEC(N'CREATE UNIQUE INDEX [PlaAlfa_MunicipalitySelection_principal_key] ON [PlaAlfa].[MunicipalitySelection]([adfId], [isPrincipal]) WHERE [isPrincipal] = 1');
END;

COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH;
