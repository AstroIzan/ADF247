BEGIN TRY
BEGIN TRAN;

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'PlaAlfa')
  EXEC(N'CREATE SCHEMA [PlaAlfa]');

CREATE TABLE [PlaAlfa].[MunicipalitySelection] (
  [municipality] NVARCHAR(200) NOT NULL CONSTRAINT [PlaAlfa_MunicipalitySelection_pkey] PRIMARY KEY,
  [isPrincipal] BIT NOT NULL CONSTRAINT [PlaAlfa_MunicipalitySelection_isPrincipal_df] DEFAULT 0,
  [updatedAt] DATETIME2 NOT NULL CONSTRAINT [PlaAlfa_MunicipalitySelection_updatedAt_df] DEFAULT SYSUTCDATETIME()
);

CREATE UNIQUE INDEX [PlaAlfa_MunicipalitySelection_principal_key]
  ON [PlaAlfa].[MunicipalitySelection]([isPrincipal])
  WHERE [isPrincipal] = 1;

COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH;
