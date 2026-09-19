BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nCarnet] NVARCHAR(50) NOT NULL,
    [nIndicatiu] NVARCHAR(max),
    [name] NVARCHAR(max) NOT NULL,
    [lastName] NVARCHAR(max),
    [password] NVARCHAR(max) NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [User_isActive_df] DEFAULT 1,
    [phone] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_nCarnet_key] UNIQUE NONCLUSTERED ([nCarnet])
);

-- CreateTable
CREATE TABLE [dbo].[Role] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nCarnet] NVARCHAR(50) NOT NULL,
    [isCapOperatiu] BIT NOT NULL CONSTRAINT [Role_isCapOperatiu_df] DEFAULT 0,
    [isCapColla] BIT NOT NULL CONSTRAINT [Role_isCapColla_df] DEFAULT 0,
    [isAdmin] BIT NOT NULL CONSTRAINT [Role_isAdmin_df] DEFAULT 0,
    [isGroc] BIT NOT NULL CONSTRAINT [Role_isGroc_df] DEFAULT 0,
    CONSTRAINT [Role_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ConvoType] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(100) NOT NULL,
    [minGrocSortida] INT NOT NULL CONSTRAINT [ConvoType_minGrocSortida_df] DEFAULT 0,
    [minVerdSortida] INT NOT NULL CONSTRAINT [ConvoType_minVerdSortida_df] DEFAULT 0,
    [defaultLocation] NVARCHAR(max),
    CONSTRAINT [ConvoType_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ConvoType_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Convocatoria] (
    [id] INT NOT NULL IDENTITY(1,1),
    [date] DATETIME2 NOT NULL,
    [title] NVARCHAR(max) NOT NULL,
    [ubiSortida] NVARCHAR(max) NOT NULL,
    [responsableId] INT,
    [convoTypeId] INT NOT NULL,
    [startTime] DATETIME2 NOT NULL,
    [finalTime] DATETIME2,
    [actualStartTime] DATETIME2,
    [actualEndTime] DATETIME2,
    [isActive] BIT NOT NULL CONSTRAINT [Convocatoria_isActive_df] DEFAULT 1,
    [autoAssignResponsable] BIT NOT NULL CONSTRAINT [Convocatoria_autoAssignResponsable_df] DEFAULT 0,
    [sortida] BIT NOT NULL CONSTRAINT [Convocatoria_sortida_df] DEFAULT 0,
    CONSTRAINT [Convocatoria_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Respuesta] (
    [id] INT NOT NULL IDENTITY(1,1),
    [convoId] INT NOT NULL,
    [userNCarnet] NVARCHAR(50) NOT NULL,
    [isCustom] BIT NOT NULL CONSTRAINT [Respuesta_isCustom_df] DEFAULT 0,
    [customText] NVARCHAR(max),
    [fullHorari] BIT NOT NULL CONSTRAINT [Respuesta_fullHorari_df] DEFAULT 0,
    [response] BIT NOT NULL,
    [attendanceConfirmed] BIT NOT NULL CONSTRAINT [Respuesta_attendanceConfirmed_df] DEFAULT 1,
    [attendanceJustified] BIT NOT NULL CONSTRAINT [Respuesta_attendanceJustified_df] DEFAULT 0,
    [source] NVARCHAR(50) NOT NULL CONSTRAINT [Respuesta_source_df] DEFAULT 'manual',
    [autoAssignReason] NVARCHAR(max),
    CONSTRAINT [Respuesta_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[NotificationLog] (
    [id] INT NOT NULL IDENTITY(1,1),
    [senderUserId] INT,
    [title] NVARCHAR(max) NOT NULL,
    [body] NVARCHAR(max) NOT NULL,
    [dataJson] NVARCHAR(max),
    [requestedCount] INT NOT NULL CONSTRAINT [NotificationLog_requestedCount_df] DEFAULT 0,
    [successCount] INT NOT NULL CONSTRAINT [NotificationLog_successCount_df] DEFAULT 0,
    [failureCount] INT NOT NULL CONSTRAINT [NotificationLog_failureCount_df] DEFAULT 0,
    [targetScope] NVARCHAR(max) NOT NULL CONSTRAINT [NotificationLog_targetScope_df] DEFAULT 'all-active-devices',
    [status] NVARCHAR(max) NOT NULL CONSTRAINT [NotificationLog_status_df] DEFAULT 'queued',
    [errorMessage] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [NotificationLog_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [NotificationLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[AvailabilityWindow] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userNCarnet] NVARCHAR(50) NOT NULL,
    [fromDateTime] DATETIME2 NOT NULL,
    [toDateTime] DATETIME2 NOT NULL,
    [availabilityType] NVARCHAR(max) NOT NULL,
    [source] NVARCHAR(max) NOT NULL CONSTRAINT [AvailabilityWindow_source_df] DEFAULT 'manual',
    [notes] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [AvailabilityWindow_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [AvailabilityWindow_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[NotificationAutomationRun] (
    [id] INT NOT NULL IDENTITY(1,1),
    [trigger] NVARCHAR(100) NOT NULL,
    [source] NVARCHAR(max) NOT NULL,
    [status] NVARCHAR(50) NOT NULL CONSTRAINT [NotificationAutomationRun_status_df] DEFAULT 'running',
    [startedAt] DATETIME2 NOT NULL CONSTRAINT [NotificationAutomationRun_startedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [finishedAt] DATETIME2,
    [durationMs] INT,
    [actorUserId] INT,
    [errorMessage] NVARCHAR(max),
    [correlationId] NVARCHAR(100) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [NotificationAutomationRun_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [NotificationAutomationRun_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[NotificationAutomationTaskRun] (
    [id] INT NOT NULL IDENTITY(1,1),
    [runId] INT NOT NULL,
    [taskKey] NVARCHAR(100) NOT NULL,
    [status] NVARCHAR(50) NOT NULL CONSTRAINT [NotificationAutomationTaskRun_status_df] DEFAULT 'running',
    [startedAt] DATETIME2 NOT NULL CONSTRAINT [NotificationAutomationTaskRun_startedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [finishedAt] DATETIME2,
    [durationMs] INT,
    [errorMessage] NVARCHAR(max),
    [detailsJson] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [NotificationAutomationTaskRun_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [NotificationAutomationTaskRun_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[UserHoursSummary] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] INT NOT NULL,
    [campaignHours] FLOAT(53) NOT NULL CONSTRAINT [UserHoursSummary_campaignHours_df] DEFAULT 0,
    [offCampaignHours] FLOAT(53) NOT NULL CONSTRAINT [UserHoursSummary_offCampaignHours_df] DEFAULT 0,
    [unansweredCount] INT NOT NULL CONSTRAINT [UserHoursSummary_unansweredCount_df] DEFAULT 0,
    [noShowCount] INT NOT NULL CONSTRAINT [UserHoursSummary_noShowCount_df] DEFAULT 0,
    [unansweredPenaltyHours] FLOAT(53) NOT NULL CONSTRAINT [UserHoursSummary_unansweredPenaltyHours_df] DEFAULT 0,
    [noShowPenaltyHours] FLOAT(53) NOT NULL CONSTRAINT [UserHoursSummary_noShowPenaltyHours_df] DEFAULT 0,
    [totalHours] FLOAT(53) NOT NULL CONSTRAINT [UserHoursSummary_totalHours_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [UserHoursSummary_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [UserHoursSummary_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UserHoursSummary_userId_key] UNIQUE NONCLUSTERED ([userId])
);

-- CreateTable
CREATE TABLE [dbo].[FormulariCampanya] (
    [id] INT NOT NULL IDENTITY(1,1),
    [convocatoriaId] INT NOT NULL,
    [dia] DATETIME2 NOT NULL,
    [responsableId] INT,
    [responsableNCarnet] NVARCHAR(max),
    [voluntarisJson] NVARCHAR(max) NOT NULL,
    [vehiclesJson] NVARCHAR(max) NOT NULL,
    [serviceMoment] NVARCHAR(50) NOT NULL,
    [createdByNCarnet] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [FormulariCampanya_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [FormulariCampanya_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Respuesta_source_idx] ON [dbo].[Respuesta]([source]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [NotificationLog_createdAt_idx] ON [dbo].[NotificationLog]([createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AvailabilityWindow_userNCarnet_idx] ON [dbo].[AvailabilityWindow]([userNCarnet]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [AvailabilityWindow_fromDateTime_toDateTime_idx] ON [dbo].[AvailabilityWindow]([fromDateTime], [toDateTime]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [NotificationAutomationRun_createdAt_idx] ON [dbo].[NotificationAutomationRun]([createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [NotificationAutomationRun_trigger_status_idx] ON [dbo].[NotificationAutomationRun]([trigger], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [NotificationAutomationRun_correlationId_idx] ON [dbo].[NotificationAutomationRun]([correlationId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [NotificationAutomationTaskRun_runId_taskKey_idx] ON [dbo].[NotificationAutomationTaskRun]([runId], [taskKey]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [NotificationAutomationTaskRun_createdAt_idx] ON [dbo].[NotificationAutomationTaskRun]([createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [FormulariCampanya_convocatoriaId_serviceMoment_idx] ON [dbo].[FormulariCampanya]([convocatoriaId], [serviceMoment]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [FormulariCampanya_dia_idx] ON [dbo].[FormulariCampanya]([dia]);

-- AddForeignKey
ALTER TABLE [dbo].[Role] ADD CONSTRAINT [Role_nCarnet_fkey] FOREIGN KEY ([nCarnet]) REFERENCES [dbo].[User]([nCarnet]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Convocatoria] ADD CONSTRAINT [Convocatoria_responsableId_fkey] FOREIGN KEY ([responsableId]) REFERENCES [dbo].[User]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Convocatoria] ADD CONSTRAINT [Convocatoria_convoTypeId_fkey] FOREIGN KEY ([convoTypeId]) REFERENCES [dbo].[ConvoType]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Respuesta] ADD CONSTRAINT [Respuesta_convoId_fkey] FOREIGN KEY ([convoId]) REFERENCES [dbo].[Convocatoria]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Respuesta] ADD CONSTRAINT [Respuesta_userNCarnet_fkey] FOREIGN KEY ([userNCarnet]) REFERENCES [dbo].[User]([nCarnet]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[NotificationLog] ADD CONSTRAINT [NotificationLog_senderUserId_fkey] FOREIGN KEY ([senderUserId]) REFERENCES [dbo].[User]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[AvailabilityWindow] ADD CONSTRAINT [AvailabilityWindow_userNCarnet_fkey] FOREIGN KEY ([userNCarnet]) REFERENCES [dbo].[User]([nCarnet]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[NotificationAutomationRun] ADD CONSTRAINT [NotificationAutomationRun_actorUserId_fkey] FOREIGN KEY ([actorUserId]) REFERENCES [dbo].[User]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[NotificationAutomationTaskRun] ADD CONSTRAINT [NotificationAutomationTaskRun_runId_fkey] FOREIGN KEY ([runId]) REFERENCES [dbo].[NotificationAutomationRun]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UserHoursSummary] ADD CONSTRAINT [UserHoursSummary_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[FormulariCampanya] ADD CONSTRAINT [FormulariCampanya_convocatoriaId_fkey] FOREIGN KEY ([convocatoriaId]) REFERENCES [dbo].[Convocatoria]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
