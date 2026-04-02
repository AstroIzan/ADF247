-- CreateTable
CREATE TABLE "NotificationAutomationRun" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trigger" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "durationMs" INTEGER,
    "actorUserId" INTEGER,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationAutomationRun_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationAutomationTaskRun" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "runId" INTEGER NOT NULL,
    "taskKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "durationMs" INTEGER,
    "errorMessage" TEXT,
    "detailsJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationAutomationTaskRun_runId_fkey" FOREIGN KEY ("runId") REFERENCES "NotificationAutomationRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "NotificationAutomationRun_createdAt_idx" ON "NotificationAutomationRun"("createdAt");

-- CreateIndex
CREATE INDEX "NotificationAutomationRun_trigger_status_idx" ON "NotificationAutomationRun"("trigger", "status");

-- CreateIndex
CREATE INDEX "NotificationAutomationTaskRun_runId_taskKey_idx" ON "NotificationAutomationTaskRun"("runId", "taskKey");

-- CreateIndex
CREATE INDEX "NotificationAutomationTaskRun_createdAt_idx" ON "NotificationAutomationTaskRun"("createdAt");
