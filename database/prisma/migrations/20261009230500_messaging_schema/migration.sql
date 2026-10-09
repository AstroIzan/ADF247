BEGIN TRY
BEGIN TRAN;

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'Messaging') EXEC(N'CREATE SCHEMA [Messaging]');

CREATE TABLE [Messaging].[Configuration] (
  [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [key] NVARCHAR(100) NOT NULL UNIQUE,
  [name] NVARCHAR(200) NOT NULL,
  [titleTemplate] NVARCHAR(MAX) NOT NULL,
  [bodyTemplate] NVARCHAR(MAX) NOT NULL,
  [audienceRuleJson] NVARCHAR(MAX) NOT NULL,
  [enabled] BIT NOT NULL CONSTRAINT [Messaging_Configuration_enabled_df] DEFAULT 1,
  [createdAt] DATETIME2 NOT NULL CONSTRAINT [Messaging_Configuration_createdAt_df] DEFAULT SYSUTCDATETIME(),
  [updatedAt] DATETIME2 NOT NULL CONSTRAINT [Messaging_Configuration_updatedAt_df] DEFAULT SYSUTCDATETIME()
);

CREATE TABLE [Messaging].[DeviceRegistration] (
  [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [userId] INT NOT NULL,
  [nCarnet] NVARCHAR(50) NOT NULL,
  [token] NVARCHAR(MAX) NOT NULL,
  [platform] NVARCHAR(30) NOT NULL,
  [userAgent] NVARCHAR(MAX) NULL,
  [isActive] BIT NOT NULL CONSTRAINT [Messaging_DeviceRegistration_isActive_df] DEFAULT 1,
  [registeredAt] DATETIME2 NOT NULL CONSTRAINT [Messaging_DeviceRegistration_registeredAt_df] DEFAULT SYSUTCDATETIME(),
  [lastSeenAt] DATETIME2 NOT NULL CONSTRAINT [Messaging_DeviceRegistration_lastSeenAt_df] DEFAULT SYSUTCDATETIME(),
  [invalidatedAt] DATETIME2 NULL,
  [invalidReason] NVARCHAR(200) NULL,
  CONSTRAINT [Messaging_DeviceRegistration_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE,
  CONSTRAINT [Messaging_DeviceRegistration_nCarnet_fkey] FOREIGN KEY ([nCarnet]) REFERENCES [dbo].[User]([nCarnet]) ON DELETE NO ACTION
);
CREATE UNIQUE INDEX [Messaging_DeviceRegistration_token_key] ON [Messaging].[DeviceRegistration]([token]);
CREATE INDEX [Messaging_DeviceRegistration_user_active_idx] ON [Messaging].[DeviceRegistration]([userId], [isActive]);

CREATE TABLE [Messaging].[Notification] (
  [id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [configurationId] INT NULL,
  [convocatoriaId] INT NULL,
  [trigger] NVARCHAR(50) NOT NULL,
  [status] NVARCHAR(30) NOT NULL CONSTRAINT [Messaging_Notification_status_df] DEFAULT N'queued',
  [title] NVARCHAR(MAX) NOT NULL,
  [body] NVARCHAR(MAX) NOT NULL,
  [payloadJson] NVARCHAR(MAX) NULL,
  [scheduledFor] DATETIME2 NULL,
  [startedAt] DATETIME2 NULL,
  [completedAt] DATETIME2 NULL,
  [requestedCount] INT NOT NULL CONSTRAINT [Messaging_Notification_requested_df] DEFAULT 0,
  [successCount] INT NOT NULL CONSTRAINT [Messaging_Notification_success_df] DEFAULT 0,
  [failureCount] INT NOT NULL CONSTRAINT [Messaging_Notification_failure_df] DEFAULT 0,
  [actorUserId] INT NULL,
  [errorMessage] NVARCHAR(MAX) NULL,
  [createdAt] DATETIME2 NOT NULL CONSTRAINT [Messaging_Notification_createdAt_df] DEFAULT SYSUTCDATETIME(),
  CONSTRAINT [Messaging_Notification_configuration_fkey] FOREIGN KEY ([configurationId]) REFERENCES [Messaging].[Configuration]([id]) ON DELETE SET NULL,
  CONSTRAINT [Messaging_Notification_convocatoria_fkey] FOREIGN KEY ([convocatoriaId]) REFERENCES [dbo].[Convocatoria]([id]) ON DELETE SET NULL,
  CONSTRAINT [Messaging_Notification_actor_fkey] FOREIGN KEY ([actorUserId]) REFERENCES [dbo].[User]([id]) ON DELETE SET NULL
);
CREATE INDEX [Messaging_Notification_status_scheduled_idx] ON [Messaging].[Notification]([status], [scheduledFor]);
CREATE INDEX [Messaging_Notification_convocatoria_created_idx] ON [Messaging].[Notification]([convocatoriaId], [createdAt]);

CREATE TABLE [Messaging].[NotificationDelivery] (
  [id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [notificationId] BIGINT NOT NULL,
  [deviceRegistrationId] INT NOT NULL,
  [userId] INT NOT NULL,
  [nCarnet] NVARCHAR(50) NOT NULL,
  [status] NVARCHAR(30) NOT NULL CONSTRAINT [Messaging_NotificationDelivery_status_df] DEFAULT N'pending',
  [attemptCount] INT NOT NULL CONSTRAINT [Messaging_NotificationDelivery_attempt_df] DEFAULT 0,
  [sentAt] DATETIME2 NULL,
  [deliveredAt] DATETIME2 NULL,
  [errorCode] NVARCHAR(100) NULL,
  [errorMessage] NVARCHAR(MAX) NULL,
  [createdAt] DATETIME2 NOT NULL CONSTRAINT [Messaging_NotificationDelivery_createdAt_df] DEFAULT SYSUTCDATETIME(),
  CONSTRAINT [Messaging_NotificationDelivery_notification_fkey] FOREIGN KEY ([notificationId]) REFERENCES [Messaging].[Notification]([id]) ON DELETE CASCADE,
  CONSTRAINT [Messaging_NotificationDelivery_device_fkey] FOREIGN KEY ([deviceRegistrationId]) REFERENCES [Messaging].[DeviceRegistration]([id]) ON DELETE NO ACTION,
  CONSTRAINT [Messaging_NotificationDelivery_user_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION
);
CREATE UNIQUE INDEX [Messaging_NotificationDelivery_notification_device_key] ON [Messaging].[NotificationDelivery]([notificationId], [deviceRegistrationId]);
CREATE INDEX [Messaging_NotificationDelivery_user_created_idx] ON [Messaging].[NotificationDelivery]([userId], [createdAt]);

CREATE TABLE [Messaging].[RunbookExecution] (
  [id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [runbookKey] NVARCHAR(100) NOT NULL,
  [trigger] NVARCHAR(30) NOT NULL,
  [status] NVARCHAR(30) NOT NULL CONSTRAINT [Messaging_RunbookExecution_status_df] DEFAULT N'running',
  [startedAt] DATETIME2 NOT NULL CONSTRAINT [Messaging_RunbookExecution_startedAt_df] DEFAULT SYSUTCDATETIME(),
  [finishedAt] DATETIME2 NULL,
  [detailsJson] NVARCHAR(MAX) NULL,
  [errorMessage] NVARCHAR(MAX) NULL
);
CREATE INDEX [Messaging_RunbookExecution_key_started_idx] ON [Messaging].[RunbookExecution]([runbookKey], [startedAt]);

COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH;
