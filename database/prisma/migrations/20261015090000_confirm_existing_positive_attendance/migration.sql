-- Prior manual replies were created with attendanceConfirmed=false despite the
-- database default and intended workflow being attendance by default.
UPDATE [dbo].[Respuesta]
SET [attendanceConfirmed] = 1,
    [attendanceJustified] = 0
WHERE [response] = 1
  AND [attendanceConfirmed] = 0
  AND [attendanceJustified] = 0;
