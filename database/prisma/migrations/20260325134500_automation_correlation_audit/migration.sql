-- Add correlationId to automation runs for observability and audit tracing
ALTER TABLE "NotificationAutomationRun" ADD COLUMN "correlationId" TEXT;

-- Backfill existing rows with deterministic value based on run id when possible
UPDATE "NotificationAutomationRun"
SET "correlationId" = ('run-' || "id")
WHERE "correlationId" IS NULL;

-- Make column required for future writes by enforcing non-null via table rebuild in SQLite
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_NotificationAutomationRun" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trigger" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "durationMs" INTEGER,
    "actorUserId" INTEGER,
    "errorMessage" TEXT,
    "correlationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationAutomationRun_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_NotificationAutomationRun" ("id","trigger","source","status","startedAt","finishedAt","durationMs","actorUserId","errorMessage","correlationId","createdAt")
SELECT "id","trigger","source","status","startedAt","finishedAt","durationMs","actorUserId","errorMessage","correlationId","createdAt"
FROM "NotificationAutomationRun";
DROP TABLE "NotificationAutomationRun";
ALTER TABLE "new_NotificationAutomationRun" RENAME TO "NotificationAutomationRun";
CREATE INDEX "NotificationAutomationRun_createdAt_idx" ON "NotificationAutomationRun"("createdAt");
CREATE INDEX "NotificationAutomationRun_trigger_status_idx" ON "NotificationAutomationRun"("trigger", "status");
CREATE INDEX "NotificationAutomationRun_correlationId_idx" ON "NotificationAutomationRun"("correlationId");
PRAGMA foreign_keys=ON;
