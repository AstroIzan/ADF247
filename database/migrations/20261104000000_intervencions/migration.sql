BEGIN TRY
BEGIN TRAN;

IF OBJECT_ID(N'[dbo].[TypeIncendis]', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[TypeIncendis] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(150) NOT NULL,
    CONSTRAINT [TypeIncendis_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [TypeIncendis_name_key] UNIQUE NONCLUSTERED ([name])
  );
  INSERT INTO [dbo].[TypeIncendis] ([name]) VALUES
    (N'Forestal'), (N'Agrícola'), (N'Pastura / matoll'), (N'Interfase urbana'),
    (N'Urbà'), (N'Vehicle'), (N'Abocador / deixalles'), (N'Altres');
END;

IF OBJECT_ID(N'[dbo].[Intervencions]', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[Intervencions] (
    [id] INT NOT NULL IDENTITY(1,1),
    [adfId] INT NOT NULL,
    [convocatoriaId] INT NULL,
    [responsableUserId] INT NULL,
    [responsableName] NVARCHAR(200) NULL,
    [responsableAdf] NVARCHAR(200) NULL,
    [date] DATE NOT NULL,
    [noticeTime] TIME(0) NULL,
    [startTime] TIME(0) NULL,
    [endTime] TIME(0) NULL,
    [level] INT NULL,
    [mapsUrl] NVARCHAR(500) NULL,
    [latitude] FLOAT NULL,
    [longitude] FLOAT NULL,
    [municipality] NVARCHAR(200) NULL,
    [sector] NVARCHAR(200) NULL,
    [comarca] NVARCHAR(200) NULL,
    [ownVehiclesJson] NVARCHAR(max) NOT NULL CONSTRAINT [Intervencions_ownVehicles_df] DEFAULT N'[]',
    [otherAdfsAttended] BIT NOT NULL CONSTRAINT [Intervencions_otherAdfs_df] DEFAULT 0,
    [otherAdfsJson] NVARCHAR(max) NOT NULL CONSTRAINT [Intervencions_otherAdfsJson_df] DEFAULT N'[]',
    [otherAdfsGrocs] INT NOT NULL CONSTRAINT [Intervencions_otherGrocs_df] DEFAULT 0,
    [otherAdfsVerds] INT NOT NULL CONSTRAINT [Intervencions_otherVerds_df] DEFAULT 0,
    [bombersAttended] BIT NOT NULL CONSTRAINT [Intervencions_bombers_df] DEFAULT 0,
    [bombersJson] NVARCHAR(max) NOT NULL CONSTRAINT [Intervencions_bombersJson_df] DEFAULT N'[]',
    [ownGrocs] INT NOT NULL CONSTRAINT [Intervencions_ownGrocs_df] DEFAULT 0,
    [ownVerds] INT NOT NULL CONSTRAINT [Intervencions_ownVerds_df] DEFAULT 0,
    [customGrocs] INT NOT NULL CONSTRAINT [Intervencions_customGrocs_df] DEFAULT 0,
    [customVerds] INT NOT NULL CONSTRAINT [Intervencions_customVerds_df] DEFAULT 0,
    [surface] DECIMAL(12,2) NULL,
    [typeIncendiId] INT NULL,
    [createdByNCarnet] NVARCHAR(50) NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Intervencions_createdAt_df] DEFAULT SYSUTCDATETIME(),
    [updatedAt] DATETIME2 NOT NULL CONSTRAINT [Intervencions_updatedAt_df] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [Intervencions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Intervencions_adfId_fkey] FOREIGN KEY ([adfId]) REFERENCES [dbo].[ADF]([id]),
    CONSTRAINT [Intervencions_convocatoriaId_fkey] FOREIGN KEY ([convocatoriaId]) REFERENCES [dbo].[Convocatoria]([id]),
    CONSTRAINT [Intervencions_responsableUserId_fkey] FOREIGN KEY ([responsableUserId]) REFERENCES [dbo].[User]([id]),
    CONSTRAINT [Intervencions_typeIncendiId_fkey] FOREIGN KEY ([typeIncendiId]) REFERENCES [dbo].[TypeIncendis]([id])
  );
  CREATE NONCLUSTERED INDEX [Intervencions_adfId_date_idx] ON [dbo].[Intervencions]([adfId], [date]);
  CREATE NONCLUSTERED INDEX [Intervencions_convocatoriaId_idx] ON [dbo].[Intervencions]([convocatoriaId]);
END;

COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH;
