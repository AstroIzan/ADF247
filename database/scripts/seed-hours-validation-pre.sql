/*
  Datos aislados para validar el resumen de horas en PRE.
  - Elimina y recrea únicamente registros cuyo carnet empieza por HVAL- y
    convocatorias cuyo título empieza por [VALIDACION HORAS].
  - Crea 50 usuarios, sus roles, 250 convocatorias Guardia entre el 01/04 y
    el 15/09 de 2026 y respuestas distribuidas entre SI, NO, ausencias
    justificadas/no justificadas y respuestas inexistentes.
  - Los usuarios no están pensados para iniciar sesión: la contraseña es una
    marca de semilla, no un hash BCrypt válido.

  Ejecutar en la base de datos PRE con una cuenta con permisos de escritura.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @StartDate date = '2026-04-01';
DECLARE @EndDate date = '2026-09-15';
DECLARE @Now datetime2 = SYSUTCDATETIME();
DECLARE @GuardiaTypeId int;

IF NOT EXISTS (
    SELECT 1
    FROM dbo.SystemConfiguration
    WHERE id = 1
      AND campaignStartDate IS NOT NULL
      AND campaignEndDate IS NOT NULL
      AND campaignStartDate <= @StartDate
      AND campaignEndDate >= @EndDate
)
    THROW 50001, 'Configura primero el periodo de campaña para cubrir del 01/04/2026 al 15/09/2026.', 1;

BEGIN TRANSACTION;

DELETE response
FROM dbo.Respuesta response
INNER JOIN dbo.Convocatoria convo ON convo.id = response.convoId
WHERE convo.title LIKE N'[VALIDACION HORAS]%';

DELETE FROM dbo.FormulariCampanya
WHERE convocatoriaId IN (
    SELECT id FROM dbo.Convocatoria WHERE title LIKE N'[VALIDACION HORAS]%'
);

DELETE FROM dbo.Convocatoria WHERE title LIKE N'[VALIDACION HORAS]%';

DELETE summary
FROM dbo.UserHoursSummary summary
INNER JOIN dbo.[User] [user] ON [user].id = summary.userId
WHERE [user].nCarnet LIKE N'HVAL-%';

DELETE FROM dbo.Role WHERE nCarnet LIKE N'HVAL-%';
DELETE FROM dbo.[User] WHERE nCarnet LIKE N'HVAL-%';

SELECT @GuardiaTypeId = id
FROM dbo.ConvoType
WHERE name COLLATE Latin1_General_100_CI_AI = N'Guardia';

IF @GuardiaTypeId IS NULL
BEGIN
    INSERT INTO dbo.ConvoType (name, minGrocSortida, minVerdSortida, defaultLocation)
    VALUES (N'Guardia', 0, 0, N'Base de validació');
    SET @GuardiaTypeId = SCOPE_IDENTITY();
END;

;WITH Numbers AS (
    SELECT 1 AS number
    UNION ALL
    SELECT number + 1 FROM Numbers WHERE number < 50
)
INSERT INTO dbo.[User] (nCarnet, nIndicatiu, name, lastName, password, isActive, phone, createdAt, updatedAt)
SELECT
    CONCAT(N'HVAL-', RIGHT(CONCAT(N'000', number), 3)),
    CONCAT(N'V', RIGHT(CONCAT(N'000', number), 3)),
    N'Validació',
    CONCAT(N'Hores ', number),
    N'PRE-SEED-NOT-FOR-LOGIN',
    1,
    NULL,
    @Now,
    @Now
FROM Numbers
OPTION (MAXRECURSION 50);

INSERT INTO dbo.Role (nCarnet, isCapOperatiu, isCapColla, isAdmin, isGroc, isDeveloper)
SELECT
    nCarnet,
    CASE WHEN nCarnet = N'HVAL-001' THEN 1 ELSE 0 END,
    0,
    CASE WHEN nCarnet = N'HVAL-001' THEN 1 ELSE 0 END,
    CASE WHEN TRY_CONVERT(int, RIGHT(nCarnet, 3)) % 2 = 0 THEN 1 ELSE 0 END,
    CASE WHEN nCarnet = N'HVAL-001' THEN 1 ELSE 0 END
FROM dbo.[User]
WHERE nCarnet LIKE N'HVAL-%';

;WITH Numbers AS (
    SELECT 1 AS number
    UNION ALL
    SELECT number + 1 FROM Numbers WHERE number < 250
)
INSERT INTO dbo.Convocatoria (
    date, title, ubiSortida, responsableId, convoTypeId, startTime, finalTime,
    actualStartTime, actualEndTime, isActive, autoAssignResponsable, sortida, responseWindowMinutes
)
SELECT
    DATEADD(day, ((number - 1) * 167) / 249, CAST(@StartDate AS datetime2)),
    CONCAT(N'[VALIDACION HORAS] Guardia ', RIGHT(CONCAT(N'000', number), 3)),
    N'Base de validació',
    (SELECT id FROM dbo.[User] WHERE nCarnet = N'HVAL-001'),
    @GuardiaTypeId,
    DATEADD(hour, 8, DATEADD(day, ((number - 1) * 167) / 249, CAST(@StartDate AS datetime2))),
    DATEADD(hour, 12, DATEADD(day, ((number - 1) * 167) / 249, CAST(@StartDate AS datetime2))),
    DATEADD(hour, 8, DATEADD(day, ((number - 1) * 167) / 249, CAST(@StartDate AS datetime2))),
    DATEADD(hour, 12, DATEADD(day, ((number - 1) * 167) / 249, CAST(@StartDate AS datetime2))),
    0,
    0,
    0,
    60
FROM Numbers
OPTION (MAXRECURSION 250);

;WITH TestResponses AS (
    SELECT
        convo.id AS convoId,
        [user].nCarnet,
        ((CHECKSUM(CONCAT(convo.id, N':', [user].nCarnet)) & 2147483647) % 5) AS responseCase
    FROM dbo.Convocatoria convo
    CROSS JOIN dbo.[User] [user]
    WHERE convo.title LIKE N'[VALIDACION HORAS]%'
      AND [user].nCarnet LIKE N'HVAL-%'
)
INSERT INTO dbo.Respuesta (
    convoId, userNCarnet, isCustom, customText, fullHorari, response,
    attendanceConfirmed, attendanceJustified, source, autoAssignReason
)
SELECT
    convoId,
    nCarnet,
    0,
    NULL,
    1,
    CASE WHEN responseCase = 1 THEN 0 ELSE 1 END,
    CASE WHEN responseCase = 0 THEN 1 ELSE 0 END,
    CASE WHEN responseCase = 3 THEN 1 ELSE 0 END,
    N'hours-validation-seed',
    NULL
FROM TestResponses
WHERE responseCase <> 4;

COMMIT TRANSACTION;

SELECT
    (SELECT COUNT(*) FROM dbo.[User] WHERE nCarnet LIKE N'HVAL-%') AS seededUsers,
    (SELECT COUNT(*) FROM dbo.Convocatoria WHERE title LIKE N'[VALIDACION HORAS]%') AS seededConvocatorias,
    (SELECT COUNT(*)
     FROM dbo.Respuesta response
     INNER JOIN dbo.Convocatoria convo ON convo.id = response.convoId
     WHERE convo.title LIKE N'[VALIDACION HORAS]%') AS seededResponses;
