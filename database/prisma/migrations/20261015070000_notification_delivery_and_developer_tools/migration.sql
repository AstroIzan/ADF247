BEGIN TRY
BEGIN TRAN;

ALTER TABLE [dbo].[Convocatoria]
ADD [responseWindowMinutes] INT NULL
    CONSTRAINT [Convocatoria_responseWindowMinutes_ck]
    CHECK ([responseWindowMinutes] IS NULL OR [responseWindowMinutes] BETWEEN 1 AND 240);

ALTER TABLE [dbo].[Role]
ADD [isDeveloper] BIT NOT NULL
    CONSTRAINT [Role_isDeveloper_df] DEFAULT 0;

ALTER TABLE [PlaAlfa].[MunicipalitySelection]
ADD
    [simulationTodayLevel] INT NULL
        CONSTRAINT [PlaAlfa_MunicipalitySelection_simulationTodayLevel_ck]
        CHECK ([simulationTodayLevel] IS NULL OR [simulationTodayLevel] BETWEEN 0 AND 4),
    [simulationTomorrowLevel] INT NULL
        CONSTRAINT [PlaAlfa_MunicipalitySelection_simulationTomorrowLevel_ck]
        CHECK ([simulationTomorrowLevel] IS NULL OR [simulationTomorrowLevel] BETWEEN 0 AND 4);

COMMIT TRAN;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRAN;
    THROW;
END CATCH;
