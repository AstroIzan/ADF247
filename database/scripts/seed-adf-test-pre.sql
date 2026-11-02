/*
  Datos de prueba multi-ADF para PRE.
  - ADFs de prueba 901-910 (se crean) y la ADF 247 (debe existir; no se modifica, solo se le añaden datos).
  - Cada ADF recibe 50 usuarios de prueba, 4 vehículos, 20 convocatorias entre el 01/06/2026 y hoy
    y la respuesta de TODOS los usuarios de la ADF (también los reales de la 247) a esas convocatorias.
  - Carnets: <ADF>/GI/9NN para grocs (grup d'intervenció) y <ADF>/9NN para verdes. Ejemplo: 247/GI/902, 247/903.
  - Marcas para identificar/limpiar: apellido "(Prova)", vehículos "TST-...", convocatorias "[TEST ADF] ...".
  - Es re-ejecutable: borra primero lo creado por una ejecución anterior.
  - Los usuarios de prueba pueden iniciar sesión con la contraseña Prova1234!
      NNN=901 -> admin + Cap Operatiu de su ADF (verde)
      NNN=902 -> Cap de Colla (groc)
      resto   -> voluntarios (pares = groc, impares = verde)
  - Limpieza: pruebas-adf/cleanup-adf-test-pre.sql
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @StartDate date = '2026-06-01';
DECLARE @EndDate date = CAST(SYSUTCDATETIME() AS date);
DECLARE @SpanDays int = DATEDIFF(day, @StartDate, @EndDate);
DECLARE @Now datetime2 = SYSUTCDATETIME();
-- Hash BCrypt de "Prova1234!"
DECLARE @PasswordHash nvarchar(100) = N'$2b$10$kbos7aMm29yQPcGPwqt2zenwzermBPOtUttyUm6n.CUxwrPN538.S';

IF @SpanDays < 19
    THROW 50001, 'El rango entre el 01/06/2026 y hoy es demasiado corto.', 1;

IF NOT EXISTS (SELECT 1 FROM dbo.ConvoType)
    THROW 50002, 'No existe ningún tipo de convocatoria (ConvoType).', 1;

IF NOT EXISTS (SELECT 1 FROM dbo.ADF WHERE number = 247)
    THROW 50003, 'No existe la ADF 247.', 1;

BEGIN TRANSACTION;

/* Limpieza de una ejecución anterior */
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

/* ADFs de prueba */
;WITH N AS (SELECT 901 AS number UNION ALL SELECT number + 1 FROM N WHERE number < 910)
INSERT INTO dbo.ADF (number, name, municipalities)
SELECT number, CONCAT(N'ADF TEST ', number),
  CASE (number % 3)
    WHEN 0 THEN N'["Girona","Salt","Banyoles"]'
    WHEN 1 THEN N'["Figueres","Roses","Cadaqués"]'
    ELSE N'["Olot","Ripoll","Puigcerdà"]'
  END
FROM N OPTION (MAXRECURSION 20);

SELECT id, number INTO #Target FROM dbo.ADF WHERE number BETWEEN 901 AND 910 OR number = 247;

/* Usuarios: 50 por ADF */
;WITH K AS (SELECT 1 AS n UNION ALL SELECT n + 1 FROM K WHERE n < 50)
INSERT INTO dbo.[User] (nCarnet, nIndicatiu, name, lastName, password, adfId, isActive, phone, createdAt, updatedAt)
SELECT
    CONCAT(a.number, N'/', CASE WHEN k.n % 2 = 0 THEN N'GI/' ELSE N'' END, 900 + k.n),
    CASE WHEN k.n % 3 = 0 THEN CONCAT(N'I', a.number, N'-', k.n) ELSE NULL END,
    CONCAT(N'Voluntari ', k.n),
    N'(Prova)',
    @PasswordHash,
    a.id, 1, NULL, @Now, @Now
FROM #Target a CROSS JOIN K k
OPTION (MAXRECURSION 60);

INSERT INTO dbo.Role (nCarnet, isCapOperatiu, isCapColla, isAdmin, isGroc, isDeveloper, isSecretariat)
SELECT
    u.nCarnet,
    CASE WHEN RIGHT(u.nCarnet, 3) = N'901' THEN 1 ELSE 0 END,
    CASE WHEN RIGHT(u.nCarnet, 3) = N'902' THEN 1 ELSE 0 END,
    CASE WHEN RIGHT(u.nCarnet, 3) = N'901' THEN 1 ELSE 0 END,
    CASE WHEN u.nCarnet LIKE N'%/GI/%' THEN 1 ELSE 0 END,
    0,
    0
FROM dbo.[User] u
WHERE u.lastName = N'(Prova)';

/* Vehículos: 4 por ADF */
;WITH V AS (SELECT 1 AS n UNION ALL SELECT n + 1 FROM V WHERE n < 4)
INSERT INTO dbo.Vehicles (adfId, indicatiu, modelo, matricula, litres, kms)
SELECT a.id,
    CONCAT(N'TST-', a.number, N'-', v.n),
    CASE v.n WHEN 1 THEN N'Toyota Hilux' WHEN 2 THEN N'Nissan Navara' WHEN 3 THEN N'Land Rover Defender' ELSE N'Mitsubishi L200' END,
    CONCAT(RIGHT(CONCAT(N'0000', a.number * 10 + v.n), 4), N' ', CHAR(66 + v.n), CHAR(68 + v.n), CHAR(70 + v.n)),
    CASE WHEN v.n % 2 = 0 THEN 0 ELSE 400 + v.n * 50 END,
    10000 + a.number * v.n
FROM #Target a CROSS JOIN V v
OPTION (MAXRECURSION 10);

/* Convocatorias: 20 por ADF repartidas entre @StartDate y hoy */
;WITH C AS (SELECT 1 AS n UNION ALL SELECT n + 1 FROM C WHERE n < 20),
Types AS (SELECT id, name, ROW_NUMBER() OVER (ORDER BY id) - 1 AS idx, COUNT(*) OVER () AS total FROM dbo.ConvoType),
Base AS (
    SELECT a.id AS adfId, a.number AS adfNumber, c.n,
        DATEADD(day, ((c.n - 1) * @SpanDays) / 19, CAST(@StartDate AS datetime2)) AS dayStart
    FROM #Target a CROSS JOIN C c
)
INSERT INTO dbo.Convocatoria (
    adfId, date, title, ubiSortida, responsableId, convoTypeId, startTime, finalTime,
    actualStartTime, actualEndTime, isActive, autoAssignResponsable, sortida, responseWindowMinutes)
SELECT
    b.adfId,
    b.dayStart,
    CONCAT(N'[TEST ADF] ', t.name, N' - ', b.adfNumber, N'/', RIGHT(CONCAT(N'00', b.n), 2)),
    CONCAT(N'Parc ', b.adfNumber),
    (SELECT u.id FROM dbo.[User] u WHERE u.nCarnet = CONCAT(b.adfNumber, N'/901')),
    t.id,
    DATEADD(hour, 8 + (b.n % 3) * 4, b.dayStart),
    DATEADD(hour, 12 + (b.n % 3) * 4, b.dayStart),
    DATEADD(hour, 8 + (b.n % 3) * 4, b.dayStart),
    DATEADD(hour, 12 + (b.n % 3) * 4, b.dayStart),
    0, 0,
    CASE WHEN b.n % 4 = 0 THEN 1 ELSE 0 END,
    60
FROM Base b
INNER JOIN Types t ON t.idx = (b.n - 1) % t.total
OPTION (MAXRECURSION 30);

/* Respuestas: todos los usuarios de la ADF a todas sus convocatorias de prueba */
;WITH R AS (
    SELECT c.id AS convoId, c.adfId, u.nCarnet,
        ((CHECKSUM(CONCAT(c.id, N':', u.nCarnet)) & 2147483647) % 100) AS rnd,
        ((CHECKSUM(CONCAT(u.nCarnet, N':', c.id)) & 2147483647) % 100) AS rnd2
    FROM dbo.Convocatoria c
    INNER JOIN dbo.[User] u ON u.adfId = c.adfId
    WHERE c.title LIKE N'[[]TEST ADF]%'
)
INSERT INTO dbo.Respuesta (
    convoId, adfId, userNCarnet, isCustom, customText, fullHorari, response,
    attendanceConfirmed, attendanceJustified, source, autoAssignReason)
SELECT
    convoId, adfId, nCarnet,
    CASE WHEN rnd >= 90 THEN 1 ELSE 0 END,
    CASE WHEN rnd >= 90 THEN N'Horari parcial (prova)' ELSE NULL END,
    CASE WHEN rnd >= 90 THEN 0 ELSE 1 END,
    CASE WHEN rnd < 25 THEN 0 ELSE 1 END,
    CASE WHEN rnd >= 25 AND rnd2 < 80 THEN 1 ELSE 0 END,
    CASE WHEN rnd < 25 AND rnd2 < 30 THEN 1 ELSE 0 END,
    N'adf-load-seed',
    NULL
FROM R;

COMMIT TRANSACTION;

SELECT a.number AS adf,
    (SELECT COUNT(*) FROM dbo.[User] u WHERE u.adfId = a.id) AS usuarios,
    (SELECT COUNT(*) FROM dbo.Vehicles v WHERE v.adfId = a.id) AS vehiculos,
    (SELECT COUNT(*) FROM dbo.Convocatoria c WHERE c.adfId = a.id AND c.title LIKE N'[[]TEST ADF]%') AS convocatorias,
    (SELECT COUNT(*) FROM dbo.Respuesta r WHERE r.adfId = a.id AND r.source = N'adf-load-seed') AS respuestas
FROM #Target a
ORDER BY a.number;

DROP TABLE #Target;
