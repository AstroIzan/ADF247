-- Add attendance confirmation flag for respuestas
ALTER TABLE "Respuesta"
ADD COLUMN "attendanceConfirmed" BOOLEAN NOT NULL DEFAULT true;
