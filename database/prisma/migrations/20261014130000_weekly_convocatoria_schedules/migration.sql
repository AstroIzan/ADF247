ALTER TABLE [dbo].[SystemConfiguration]
ADD [weeklyConvocatoriaSchedulesJson] NVARCHAR(MAX) NOT NULL
    CONSTRAINT [SystemConfiguration_weeklySchedules_df] DEFAULT N'[]';
