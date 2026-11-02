/*
  Datos de prueba multi-ADF para PRE.
  - Crea 10 ADFs de prueba (números 901-910), cada una con 50 usuarios, 4 vehículos,
    20 convocatorias entre el 01/06/2026 y hoy (200 en total) y la respuesta de
    todos los usuarios de la ADF a todas sus convocatorias (10.000 respuestas).
  - Todo es identificable: ADF 901-910, carnets T9xx-NNN, títulos [TEST ADF].
  - Es re-ejecutable: borra primero lo creado por una ejecución anterior.
  - Los usuarios SÍ pueden iniciar sesión: contraseña Prova1234!
      T901-001 -> admin + Cap Operatiu de la ADF 901
      T901-002 -> Cap de Colla
      resto    -> voluntarios (pares = groc)
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

BEGIN TRANSACTION;

/* Limpieza de una ejecución anterior */
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
DELETE m FROM PlaAlfa.MunicipalitySelection m INNER JOIN dbo.ADF a ON a.id = m.adfId WHERE a.number BETWEEN 901 AND 910;
DELETE FROM dbo.ADF WHERE number BETWEEN 901 AND 910;

/* ADFs */
;WITH N AS (SELECT 901 AS number UNION ALL SELECT number + 1 FROM N WHERE number < 910)
INSERT INTO dbo.ADF (number, name, municipalities)
SELECT number, CONCAT(N'ADF TEST ', number),
  CASE (number % 3)
    WHEN 0 THEN N'["Girona","Salt","Banyoles"]'
    WHEN 1 THEN N'["Figueres","Roses","Cadaqués"]'
    ELSE N'["Olot","Ripoll","Puigcerdà"]'
  END
FROM N OPTION (MAXRECURSION 20);

/* Usuarios: 50 por ADF */
;WITH K AS (SELECT 1 AS n UNION ALL SELECT n + 1 FROM K WHERE n < 50)
INSERT INTO dbo.[User] (nCarnet, nIndicatiu, name, lastName, password, adfId, isActive, phone, createdAt, updatedAt)
SELECT
    CONCAT(N'T', a.number, N'-', RIGHT(CONCAT(N'000', k.n), 3)),
    CASE WHEN k.n % 3 = 0 THEN CONCAT(N'I', a.number, N'-', k.n) ELSE NULL END,
    CONCAT(N'Voluntari ', k.n),
    CONCAT(N'ADF ', a.number),
    @PasswordHash,
    a.id, 1, NULL, @Now, @Now
FROM dbo.ADF a CROSS JOIN K k
WHERE a.number BETWEEN 901 AND 910
OPTION (MAXRECURSION 60);

INSERT INTO dbo.Role (nCarnet, isCapOperatiu, isCapColla, isAdmin, isGroc, isDeveloper, isSecretariat)
SELECT
    u.nCarnet,
    CASE WHEN RIGHT(u.nCarnet, 3) = N'001' THEN 1 ELSE 0 END,
    CASE WHEN RIGHT(u.nCarnet, 3) = N'002' THEN 1 ELSE 0 END,
    CASE WHEN RIGHT(u.nCarnet, 3) = N'001' THEN 1 ELSE 0 END,
    CASE WHEN TRY_CONVERT(int, RIGHT(u.nCarnet, 3)) % 2 = 0 THEN 1 ELSE 0 END,
    0,
    0
FROM dbo.[User] u
INNER JOIN dbo.ADF a ON a.id = u.adfId
WHERE a.number BETWEEN 901 AND 910;

/* Vehículos: 4 por ADF */
;WITH V AS (SELECT 1 AS n UNION ALL SELECT n + 1 FROM V WHERE n < 4)
INSERT INTO dbo.Vehicles (adfId, indicatiu, modelo, matricula, litres, kms)
SELECT a.id,
    CONCAT(N'V', a.number, N'-', v.n),
    CASE v.n WHEN 1 THEN N'Toyota Hilux' WHEN 2 THEN N'Nissan Navara' WHEN 3 THEN N'Land Rover Defender' ELSE N'Mitsubishi L200' END,
    CONCAT(RIGHT(CONCAT(N'0000', a.number * 10 + v.n), 4), N' ', CHAR(66 + v.n), CHAR(68 + v.n), CHAR(70 + v.n)),
    CASE WHEN v.n % 2 = 0 THEN 0 ELSE 400 + v.n * 50 END,
    10000 + a.number * v.n
FROM dbo.ADF a CROSS JOIN V v
WHERE a.number BETWEEN 901 AND 910
OPTION (MAXRECURSION 10);

/* Convocatorias: 20 por ADF repartidas entre @StartDate y hoy */
;WITH C AS (SELECT 1 AS n UNION ALL SELECT n + 1 FROM C WHERE n < 20),
Types AS (SELECT id, name, ROW_NUMBER() OVER (ORDER BY id) - 1 AS idx, COUNT(*) OVER () AS total FROM dbo.ConvoType),
Base AS (
    SELECT a.id AS adfId, a.number AS adfNumber, c.n,
        DATEADD(day, ((c.n - 1) * @SpanDays) / 19, CAST(@StartDate AS datetime2)) AS dayStart
    FROM dbo.ADF a CROSS JOIN C c
    WHERE a.number BETWEEN 901 AND 910
)
INSERT INTO dbo.Convocatoria (
    adfId, date, title, ubiSortida, responsableId, convoTypeId, startTime, finalTime,
    actualStartTime, actualEndTime, isActive, autoAssignResponsable, sortida, responseWindowMinutes)
SELECT
    b.adfId,
    b.dayStart,
    CONCAT(N'[TEST ADF] ', t.name, N' - ', b.adfNumber, N'/', RIGHT(CONCAT(N'00', b.n), 2)),
    CONCAT(N'Parc ', b.adfNumber),
    (SELECT u.id FROM dbo.[User] u WHERE u.nCarnet = CONCAT(N'T', b.adfNumber, N'-001')),
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

/* Respuestas: todos los usuarios de la ADF a todas sus convocatorias */
;WITH R AS (
    SELECT c.id AS convoId, c.adfId, u.nCarnet,
        ((CHECKSUM(CONCAT(c.id, N':', u.nCarnet)) & 2147483647) % 100) AS rnd,
        ((CHECKSUM(CONCAT(u.nCarnet, N':', c.id)) & 2147483647) % 100) AS rnd2
    FROM dbo.Convocatoria c
    INNER JOIN dbo.ADF a ON a.id = c.adfId
    INNER JOIN dbo.[User] u ON u.adfId = c.adfId
    WHERE a.number BETWEEN 901 AND 910 AND c.title LIKE N'[[]TEST ADF]%'
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
    (SELECT COUNT(*) FROM dbo.Convocatoria c WHERE c.adfId = a.id) AS convocatorias,
    (SELECT COUNT(*) FROM dbo.Respuesta r WHERE r.adfId = a.id) AS respuestas
FROM dbo.ADF a
WHERE a.number BETWEEN 901 AND 910
ORDER BY a.number;
