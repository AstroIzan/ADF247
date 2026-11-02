BEGIN TRY
BEGIN TRAN;

IF OBJECT_ID(N'[dbo].[Vehicles]', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[Vehicles] (
    [id] INT NOT NULL IDENTITY(1,1),
    [adfId] INT NOT NULL,
    [indicatiu] NVARCHAR(100) NOT NULL,
    [modelo] NVARCHAR(200) NULL,
    [matricula] NVARCHAR(30) NULL,
    [litres] DECIMAL(18,2) NOT NULL CONSTRAINT [Vehicles_litres_df] DEFAULT 0,
    [kms] DECIMAL(18,2) NOT NULL CONSTRAINT [Vehicles_kms_df] DEFAULT 0,
    CONSTRAINT [Vehicles_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Vehicles_adfId_fkey] FOREIGN KEY ([adfId]) REFERENCES [dbo].[ADF]([id]),
    CONSTRAINT [Vehicles_adfId_indicatiu_key] UNIQUE NONCLUSTERED ([adfId], [indicatiu])
  );

  EXEC(N'
    DECLARE @adfId INT = (SELECT TOP 1 [id] FROM [dbo].[ADF] ORDER BY [number]);
    DECLARE @json NVARCHAR(max) = (SELECT TOP 1 [vehicleCatalogJson] FROM [dbo].[SystemConfiguration] WHERE [id] = 1);
    IF @adfId IS NOT NULL AND ISJSON(@json) = 1
      INSERT INTO [dbo].[Vehicles] ([adfId], [indicatiu], [modelo], [litres], [kms])
      SELECT @adfId, v.[indicatiu], MAX(v.[modelo]), MAX(v.[litres]), MAX(v.[kms])
      FROM OPENJSON(@json) WITH (
        [indicatiu] NVARCHAR(100) ''$.Indicatiu'',
        [modelo] NVARCHAR(200) ''$.Modelo'',
        [litres] DECIMAL(18,2) ''$.Litres'',
        [kms] DECIMAL(18,2) ''$.Kms''
      ) v
      WHERE v.[indicatiu] IS NOT NULL AND LEN(v.[indicatiu]) > 0
      GROUP BY v.[indicatiu];
  ');
END;

COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH;
