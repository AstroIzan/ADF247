BEGIN TRY
BEGIN TRAN;

ALTER TABLE [PlaAlfa].[MunicipalitySelection]
DROP CONSTRAINT [PlaAlfa_MunicipalitySelection_simulationTodayLevel_ck];

ALTER TABLE [PlaAlfa].[MunicipalitySelection]
DROP CONSTRAINT [PlaAlfa_MunicipalitySelection_simulationTomorrowLevel_ck];

ALTER TABLE [PlaAlfa].[MunicipalitySelection]
ADD
    CONSTRAINT [PlaAlfa_MunicipalitySelection_simulationTodayLevel_ck]
        CHECK ([simulationTodayLevel] IS NULL OR [simulationTodayLevel] BETWEEN 0 AND 5),
    CONSTRAINT [PlaAlfa_MunicipalitySelection_simulationTomorrowLevel_ck]
        CHECK ([simulationTomorrowLevel] IS NULL OR [simulationTomorrowLevel] BETWEEN 0 AND 5);

COMMIT TRAN;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRAN;
    THROW;
END CATCH;
