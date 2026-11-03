IF COL_LENGTH(N'dbo.Intervencions', N'observacions') IS NULL
BEGIN
  ALTER TABLE [dbo].[Intervencions] ADD [observacions] NVARCHAR(2000) NULL;
END

-- Les respostes automàtiques s'han de notificar sempre (la configuració venia desactivada per defecte).
UPDATE [dbo].[SystemConfiguration] SET [notifyOnAutoAvailableResponse] = 1 WHERE [notifyOnAutoAvailableResponse] = 0;
