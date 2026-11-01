BEGIN TRY
BEGIN TRAN;

ALTER TABLE [dbo].[SystemConfiguration]
ADD
    [pviEnabled] BIT NOT NULL
        CONSTRAINT [SystemConfiguration_pviEnabled_df] DEFAULT 0,
    [dailyNotificationsHour] INT NOT NULL
        CONSTRAINT [SystemConfiguration_dailyNotificationsHour_df] DEFAULT 8,
    [dailyNotificationsMinute] INT NOT NULL
        CONSTRAINT [SystemConfiguration_dailyNotificationsMinute_df] DEFAULT 0,
    CONSTRAINT [SystemConfiguration_dailyNotificationsHour_ck]
        CHECK ([dailyNotificationsHour] BETWEEN 0 AND 23),
    CONSTRAINT [SystemConfiguration_dailyNotificationsMinute_ck]
        CHECK ([dailyNotificationsMinute] BETWEEN 0 AND 59);

ALTER TABLE [dbo].[SystemConfiguration]
DROP CONSTRAINT [SystemConfiguration_pendingDays_df],
    [SystemConfiguration_pendingHours_df];

ALTER TABLE [dbo].[SystemConfiguration]
DROP COLUMN [pendingLeadDays], [pendingLeadHours];

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
    N'convocatoria-multiple-today',
    N'Convocatories múltiples - avui',
    N'Tens diferentes convocatories per avui.',
    N'Entra a l''aplicatiu i revisa les convocatories per avui.',
    N'{"messageKind":"convocatoria","timing":"today","recipientSelector":{"response":"yes-or-custom","roles":{"include":[],"exclude":[]}}}',
    0
),
(
    N'availability-multiple-today',
    N'Disponibilitats múltiples - avui',
    N'Tens diferentes convocatories per avui sense respondre.',
    N'Entra a l''aplicatiu i revisa les convocatories sense resposta per avui.',
    N'{"messageKind":"availability","timing":"today","recipientSelector":{"response":"missing","roles":{"include":[],"exclude":[]}}}',
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
    [updatedAt] = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (
    [key], [name], [titleTemplate], [bodyTemplate], [audienceRuleJson], [enabled], [createdAt], [updatedAt]
) VALUES (
    [source].[key], [source].[name], [source].[titleTemplate], [source].[bodyTemplate],
    [source].[audienceRuleJson], [source].[enabled], SYSUTCDATETIME(), SYSUTCDATETIME()
);

COMMIT TRAN;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRAN;
    THROW;
END CATCH;
