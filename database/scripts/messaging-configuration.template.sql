/*
  Execute this script manually only after replacing the example row below.

  key: stable identifier used by a Messaging runbook's "template" field.
  titleTemplate/bodyTemplate: literal text today. Placeholder expansion has not
  been implemented yet, so do not use {{convocatoria.title}} or similar tokens.
  audienceRuleJson: reserved, validated JSON that describes the intended
  recipient audience. The current worker does not evaluate it; scheduled
  runbooks send to all active registered devices. Keep configurations disabled
  until audience-rule evaluation is implemented and verified.
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

-- Add one INSERT row per agreed use case. The template is intentionally empty,
-- so executing it before it is completed changes no production data.
--
-- INSERT INTO @Configurations (
--   [key], [name], [titleTemplate], [bodyTemplate], [audienceRuleJson], [enabled]
-- ) VALUES (
--   N'example-disabled',
--   N'Example configuration',
--   N'Example title',
--   N'Example body',
--   N'{"recipientMode":"all-active-devices","filters":[]}',
--   0
-- );

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
