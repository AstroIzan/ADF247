/*
  Messaging configurations from the agreed use-case matrix.

  Placeholder values that the API/worker must render before queueing:
    {{convocatoria.title}}          dbo.Convocatoria.title
    {{convocatoria.date}}           local formatted dbo.Convocatoria.date
    {{convocatoria.startTime}}      local formatted dbo.Convocatoria.startTime
    {{convocatoria.endTime}}        local formatted dbo.Convocatoria.finalTime
    {{convocatoria.location}}       dbo.Convocatoria.ubiSortida
    {{convocatoria.responsable}}    responsible user's display name
    {{response.deadline}}           response deadline calculated for the dispatch
    {{fire.location}}               fire location/population supplied by the trigger

  audienceRuleJson declares the intended audience. Keep every configuration
  disabled until the API/worker evaluates both the placeholders and these rules.
*/
SET XACT_ABORT ON;
BEGIN TRAN;

DECLARE @Configurations TABLE (
  [key] NVARCHAR(100) NOT NULL PRIMARY KEY,
  [name] NVARCHAR(200) NOT NULL,
  [titleTemplate] NVARCHAR(MAX) NOT NULL,
  [bodyTemplate] NVARCHAR(MAX) NOT NULL,
  [audienceRuleJson] NVARCHAR(MAX) NOT NULL,
  [enabled] BIT NOT NULL
);

INSERT INTO @Configurations (
  [key], [name], [titleTemplate], [bodyTemplate], [audienceRuleJson], [enabled]
)
VALUES
  (
    N'availability-now',
    N'Disponibilitat - ara',
    N'Disponibilitat per {{convocatoria.title}}',
    N'Es sol·licita disponibilitat per a tots els voluntaris que puguin estar a brigades en {{response.deadline}}.',
    N'{"messageKind":"availability","timing":"now","recipientSelector":{"response":"missing","roles":{"include":[],"exclude":[]}}}',
    0
  ),
  (
    N'availability-today',
    N'Disponibilitat - avui',
    N'Disponibilitat per {{convocatoria.title}}',
    N'Es sol·licita disponibilitat per avui de {{convocatoria.startTime}} a {{convocatoria.endTime}}.',
    N'{"messageKind":"availability","timing":"today","recipientSelector":{"response":"missing","roles":{"include":[],"exclude":[]}}}',
    0
  ),
  (
    N'availability-tomorrow',
    N'Disponibilitat - demà',
    N'Disponibilitat per {{convocatoria.title}}',
    N'Es sol·licita disponibilitat per demà de {{convocatoria.startTime}} a {{convocatoria.endTime}}.',
    N'{"messageKind":"availability","timing":"tomorrow","recipientSelector":{"response":"missing","roles":{"include":[],"exclude":[]}}}',
    0
  ),
  (
    N'availability-future',
    N'Disponibilitat - posterior',
    N'Disponibilitat per {{convocatoria.title}}',
    N'Es sol·licita disponibilitat per al {{convocatoria.date}} de {{convocatoria.startTime}} a {{convocatoria.endTime}}.',
    N'{"messageKind":"availability","timing":"future","recipientSelector":{"response":"missing","roles":{"include":[],"exclude":[]}}}',
    0
  ),
  (
    N'availability-weekly',
    N'Disponibilitat setmanal',
    N'Disponibilitat setmanal per respondre',
    N'Entra a l''aplicatiu i respon la convocatòria setmanal.',
    N'{"messageKind":"availability","timing":"weekly","recipientSelector":{"response":"missing","roles":{"include":[],"exclude":[]}}}',
    0
  ),
  (
    N'availability-fire',
    N'Disponibilitat - incendi',
    N'Disponibilitat per incendi a {{fire.location}}',
    N'Es sol·licita disponibilitat a tots els grocs que puguin estar a brigades en {{response.deadline}}.',
    N'{"messageKind":"availability","timing":"fire","recipientSelector":{"response":"missing","roles":{"include":["groc"],"exclude":[]}}}',
    0
  ),
  (
    N'convocatoria-now',
    N'Convocatòria - ara',
    N'Sortida per {{convocatoria.title}}',
    N'Voluntaris disponibles a brigades en {{response.deadline}}. Responsable: {{convocatoria.responsable}}.',
    N'{"messageKind":"convocatoria","timing":"now","recipientSelector":{"response":"yes","roles":{"include":[],"exclude":[]}}}',
    0
  ),
  (
    N'convocatoria-today',
    N'Convocatòria - avui',
    N'Convocatòria per {{convocatoria.title}}',
    N'Voluntaris disponibles avui a les {{convocatoria.startTime}} a {{convocatoria.location}}. Responsable: {{convocatoria.responsable}}.',
    N'{"messageKind":"convocatoria","timing":"today","recipientSelector":{"response":"yes","roles":{"include":[],"exclude":[]}}}',
    0
  ),
  (
    N'convocatoria-tomorrow',
    N'Convocatòria - demà',
    N'Convocatòria per {{convocatoria.title}}',
    N'Voluntaris disponibles demà a les {{convocatoria.startTime}} a {{convocatoria.location}}. Responsable: {{convocatoria.responsable}}.',
    N'{"messageKind":"convocatoria","timing":"tomorrow","recipientSelector":{"response":"yes","roles":{"include":[],"exclude":[]}}}',
    0
  ),
  (
    N'convocatoria-future',
    N'Convocatòria - posterior',
    N'Convocatòria per {{convocatoria.title}}',
    N'Voluntaris disponibles el {{convocatoria.date}} de {{convocatoria.startTime}} a {{convocatoria.location}}. Responsable: {{convocatoria.responsable}}.',
    N'{"messageKind":"convocatoria","timing":"future","recipientSelector":{"response":"yes","roles":{"include":[],"exclude":[]}}}',
    0
  ),
  (
    N'convocatoria-weekly',
    N'Planificació de convocatòries setmanals',
    N'Convocatòria setmanal',
    N'S''enviarà una convocatòria cada dia a les 08:00 per a la convocatòria del dia següent i per a la del dia en curs.',
    N'{"messageKind":"convocatoria","timing":"weekly","recipientSelector":{"response":"yes","roles":{"include":[],"exclude":[]}}}',
    0
  ),
  (
    N'convocatoria-fire',
    N'Convocatòria - incendi',
    N'Sortida per incendi a {{fire.location}}',
    N'Grocs disponibles a brigades en {{response.deadline}}. Responsable: {{convocatoria.responsable}}.',
    N'{"messageKind":"convocatoria","timing":"fire","recipientSelector":{"response":"yes","roles":{"include":["groc"],"exclude":[]}}}',
    0
  );

MERGE [Messaging].[Configuration] AS [target]
USING @Configurations AS [source]
  ON [target].[key] = [source].[key]
WHEN MATCHED THEN UPDATE SET
  [name] = [source].[name],
  [titleTemplate] = [source].[titleTemplate],
  [bodyTemplate] = [source].[bodyTemplate],
  [audienceRuleJson] = [source].[audienceRuleJson],
  [enabled] = [source].[enabled],
  [updatedAt] = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (
  [key], [name], [titleTemplate], [bodyTemplate], [audienceRuleJson], [enabled], [createdAt], [updatedAt]
) VALUES (
  [source].[key], [source].[name], [source].[titleTemplate], [source].[bodyTemplate],
  [source].[audienceRuleJson], [source].[enabled], SYSUTCDATETIME(), SYSUTCDATETIME()
);

COMMIT TRAN;
