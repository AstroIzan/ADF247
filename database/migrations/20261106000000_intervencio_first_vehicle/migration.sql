IF COL_LENGTH(N'dbo.Intervencions', N'firstInterventionVehicle') IS NULL
BEGIN
  ALTER TABLE [dbo].[Intervencions] ADD [firstInterventionVehicle] NVARCHAR(100) NULL;
END
