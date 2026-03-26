-- AlterTable: Add source and autoAssignReason fields to Respuesta for audit trail
ALTER TABLE "Respuesta" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "Respuesta" ADD COLUMN "autoAssignReason" TEXT;

-- CreateIndex for efficient admin panel queries
CREATE INDEX "Respuesta_source_idx" ON "Respuesta"("source");
