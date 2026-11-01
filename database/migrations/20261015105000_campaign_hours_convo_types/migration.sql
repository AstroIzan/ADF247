ALTER TABLE [dbo].[SystemConfiguration]
ADD [campaignHoursConvoTypeIdsJson] NVARCHAR(max) NOT NULL
    CONSTRAINT [SystemConfiguration_campaignHoursConvoTypeIdsJson_df] DEFAULT N'[]';
