/*
  Limpia exclusivamente los datos creados por seed-hours-validation-pre.sql.
  No elimina convocatorias, usuarios ni respuestas ajenos a la validación.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRANSACTION;

DELETE response
FROM dbo.Respuesta response
INNER JOIN dbo.Convocatoria convo ON convo.id = response.convoId
WHERE convo.title LIKE N'[[]VALIDACION HORAS]%';

DELETE FROM dbo.FormulariCampanya
WHERE convocatoriaId IN (
    SELECT id FROM dbo.Convocatoria WHERE title LIKE N'[[]VALIDACION HORAS]%'
);

DELETE FROM dbo.Convocatoria
WHERE title LIKE N'[[]VALIDACION HORAS]%';

DELETE summary
FROM dbo.UserHoursSummary summary
INNER JOIN dbo.[User] [user] ON [user].id = summary.userId
WHERE [user].nCarnet LIKE N'HVAL-%';

DELETE FROM dbo.Role WHERE nCarnet LIKE N'HVAL-%';
DELETE FROM dbo.[User] WHERE nCarnet LIKE N'HVAL-%';

COMMIT TRANSACTION;

SELECT
    (SELECT COUNT(*) FROM dbo.[User] WHERE nCarnet LIKE N'HVAL-%') AS remainingSeedUsers,
    (SELECT COUNT(*) FROM dbo.Convocatoria WHERE title LIKE N'[[]VALIDACION HORAS]%') AS remainingSeedConvocatorias,
    (SELECT COUNT(*) FROM dbo.Respuesta response
     INNER JOIN dbo.Convocatoria convo ON convo.id = response.convoId
     WHERE convo.title LIKE N'[[]VALIDACION HORAS]%') AS remainingSeedResponses;
