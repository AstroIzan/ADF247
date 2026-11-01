CREATE TABLE [dbo].[SystemConfiguration] (
    [id] INT NOT NULL,
    [autoCreateUnavailableForUsersWithoutWindow] BIT NOT NULL CONSTRAINT [SystemConfiguration_autoUnavailable_df] DEFAULT 0,
    [notifyOnAutoAvailableResponse] BIT NOT NULL CONSTRAINT [SystemConfiguration_notifyAutoAvailable_df] DEFAULT 0,
    [weeklyConvoTypeIdsJson] NVARCHAR(MAX) NOT NULL CONSTRAINT [SystemConfiguration_weeklyTypes_df] DEFAULT N'[]',
    [weeklyRequestWeekday] INT NOT NULL CONSTRAINT [SystemConfiguration_weekday_df] DEFAULT 5,
    [weeklyRequestHour] INT NOT NULL CONSTRAINT [SystemConfiguration_hour_df] DEFAULT 8,
    [weeklyRequestMinute] INT NOT NULL CONSTRAINT [SystemConfiguration_minute_df] DEFAULT 0,
    [availabilityManagerNCarnetsJson] NVARCHAR(MAX) NOT NULL CONSTRAINT [SystemConfiguration_managers_df] DEFAULT N'[]',
    [pendingLeadDays] INT NOT NULL CONSTRAINT [SystemConfiguration_pendingDays_df] DEFAULT 0,
    [pendingLeadHours] INT NOT NULL CONSTRAINT [SystemConfiguration_pendingHours_df] DEFAULT 24,
    [campaignStartDate] DATE NULL,
    [campaignEndDate] DATE NULL,
    [unansweredPenaltyThreshold] INT NOT NULL CONSTRAINT [SystemConfiguration_unansweredThreshold_df] DEFAULT 0,
    [unansweredPenaltyHours] DECIMAL(5, 2) NOT NULL CONSTRAINT [SystemConfiguration_unansweredPenalty_df] DEFAULT 1,
    [noShowPenaltyHours] DECIMAL(5, 2) NOT NULL CONSTRAINT [SystemConfiguration_noShowPenalty_df] DEFAULT 4,
    [vehicleCatalogJson] NVARCHAR(MAX) NOT NULL CONSTRAINT [SystemConfiguration_vehicles_df] DEFAULT N'[]',
    [updatedAt] DATETIME2 NOT NULL CONSTRAINT [SystemConfiguration_updatedAt_df] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [SystemConfiguration_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [SystemConfiguration_singleton_ck] CHECK ([id] = 1),
    CONSTRAINT [SystemConfiguration_weekday_ck] CHECK ([weeklyRequestWeekday] BETWEEN 0 AND 6),
    CONSTRAINT [SystemConfiguration_hour_ck] CHECK ([weeklyRequestHour] BETWEEN 0 AND 23),
    CONSTRAINT [SystemConfiguration_minute_ck] CHECK ([weeklyRequestMinute] BETWEEN 0 AND 59)
);

INSERT INTO [dbo].[SystemConfiguration] ([id]) VALUES (1);
