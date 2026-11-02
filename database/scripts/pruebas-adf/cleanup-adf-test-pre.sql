/*
  Elimina los datos creados por seed-adf-test-pre.sql: ADFs 901-910 completas y, en la ADF 247,
  solo los usuarios "(Prova)", vehículos "TST-..." y convocatorias "[TEST ADF]" con sus respuestas.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRANSACTION;

/* Datos de las ADFs 901-910 (incluye los de versiones anteriores del script) */
DELETE r FROM dbo.Respuesta r INNER JOIN dbo.ADF a ON a.id = r.adfId WHERE a.number BETWEEN 901 AND 910;
DELETE f FROM dbo.FormulariCampanya f INNER JOIN dbo.Convocatoria c ON c.id = f.convocatoriaId
  INNER JOIN dbo.ADF a ON a.id = c.adfId WHERE a.number BETWEEN 901 AND 910;
DELETE c FROM dbo.Convocatoria c INNER JOIN dbo.ADF a ON a.id = c.adfId WHERE a.number BETWEEN 901 AND 910;
DELETE s FROM dbo.UserHoursSummary s INNER JOIN dbo.[User] u ON u.id = s.userId
  INNER JOIN dbo.ADF a ON a.id = u.adfId WHERE a.number BETWEEN 901 AND 910;
DELETE ro FROM dbo.Role ro INNER JOIN dbo.[User] u ON u.nCarnet = ro.nCarnet
  INNER JOIN dbo.ADF a ON a.id = u.adfId WHERE a.number BETWEEN 901 AND 910;
DELETE u FROM dbo.[User] u INNER JOIN dbo.ADF a ON a.id = u.adfId WHERE a.number BETWEEN 901 AND 910;
DELETE v FROM dbo.Vehicles v INNER JOIN dbo.ADF a ON a.id = v.adfId WHERE a.number BETWEEN 901 AND 910;
DELETE r FROM dbo.Respuesta r
  WHERE r.convoId IN (SELECT id FROM dbo.Convocatoria WHERE title LIKE N'[[]TEST ADF]%')
     OR r.userNCarnet IN (SELECT nCarnet FROM dbo.[User] WHERE lastName = N'(Prova)');
DELETE f FROM dbo.FormulariCampanya f
  WHERE f.convocatoriaId IN (SELECT id FROM dbo.Convocatoria WHERE title LIKE N'[[]TEST ADF]%');
DELETE FROM dbo.Convocatoria WHERE title LIKE N'[[]TEST ADF]%';
DELETE s FROM dbo.UserHoursSummary s WHERE s.userId IN (SELECT id FROM dbo.[User] WHERE lastName = N'(Prova)');
DELETE FROM dbo.Role WHERE nCarnet IN (SELECT nCarnet FROM dbo.[User] WHERE lastName = N'(Prova)');
DELETE FROM dbo.[User] WHERE lastName = N'(Prova)';
DELETE FROM dbo.Vehicles WHERE indicatiu LIKE N'TST-%';
DELETE m FROM PlaAlfa.MunicipalitySelection m INNER JOIN dbo.ADF a ON a.id = m.adfId WHERE a.number BETWEEN 901 AND 910;
DELETE FROM dbo.ADF WHERE number BETWEEN 901 AND 910;

COMMIT TRANSACTION;

SELECT
    (SELECT COUNT(*) FROM dbo.ADF WHERE number BETWEEN 901 AND 910) AS remainingAdfs,
    (SELECT COUNT(*) FROM dbo.[User] WHERE lastName = N'(Prova)') AS remainingUsers,
    (SELECT COUNT(*) FROM dbo.Convocatoria WHERE title LIKE N'[[]TEST ADF]%') AS remainingConvocatorias;
