-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "nCarnet" TEXT NOT NULL,
    "nIndicatiu" TEXT,
    "name" TEXT NOT NULL,
    "lastName" TEXT,
    "password" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "nCarnet" TEXT NOT NULL,
    "isCapOperatiu" BOOLEAN NOT NULL DEFAULT false,
    "isCapColla" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isGroc" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConvoType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "minGrocSortida" INTEGER NOT NULL DEFAULT 0,
    "minVerdSortida" INTEGER NOT NULL DEFAULT 0,
    "defaultLocation" TEXT,

    CONSTRAINT "ConvoType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Convocatoria" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "ubiSortida" TEXT NOT NULL,
    "responsableId" INTEGER,
    "convoTypeId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "finalTime" TIMESTAMP(3),
    "actualStartTime" TIMESTAMP(3),
    "actualEndTime" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "autoAssignResponsable" BOOLEAN NOT NULL DEFAULT false,
    "sortida" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Convocatoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Respuesta" (
    "id" SERIAL NOT NULL,
    "convoId" INTEGER NOT NULL,
    "userNCarnet" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "customText" TEXT,
    "fullHorari" BOOLEAN NOT NULL DEFAULT false,
    "response" BOOLEAN NOT NULL,
    "attendanceConfirmed" BOOLEAN NOT NULL DEFAULT true,
    "attendanceJustified" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "autoAssignReason" TEXT,

    CONSTRAINT "Respuesta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" SERIAL NOT NULL,
    "senderUserId" INTEGER,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "dataJson" TEXT,
    "requestedCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "targetScope" TEXT NOT NULL DEFAULT 'all-active-devices',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityWindow" (
    "id" SERIAL NOT NULL,
    "userNCarnet" TEXT NOT NULL,
    "fromDateTime" TIMESTAMP(3) NOT NULL,
    "toDateTime" TIMESTAMP(3) NOT NULL,
    "availabilityType" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilityWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationAutomationRun" (
    "id" SERIAL NOT NULL,
    "trigger" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "actorUserId" INTEGER,
    "errorMessage" TEXT,
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationAutomationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationAutomationTaskRun" (
    "id" SERIAL NOT NULL,
    "runId" INTEGER NOT NULL,
    "taskKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "errorMessage" TEXT,
    "detailsJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationAutomationTaskRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserHoursSummary" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "campaignHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "offCampaignHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unansweredCount" INTEGER NOT NULL DEFAULT 0,
    "noShowCount" INTEGER NOT NULL DEFAULT 0,
    "unansweredPenaltyHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "noShowPenaltyHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserHoursSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormulariCampanya" (
    "id" SERIAL NOT NULL,
    "convocatoriaId" INTEGER NOT NULL,
    "dia" TIMESTAMP(3) NOT NULL,
    "responsableId" INTEGER,
    "responsableNCarnet" TEXT,
    "voluntarisJson" TEXT NOT NULL,
    "vehiclesJson" TEXT NOT NULL,
    "serviceMoment" TEXT NOT NULL,
    "createdByNCarnet" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormulariCampanya_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_nCarnet_key" ON "User"("nCarnet");

-- CreateIndex
CREATE UNIQUE INDEX "ConvoType_name_key" ON "ConvoType"("name");

-- CreateIndex
CREATE INDEX "Respuesta_source_idx" ON "Respuesta"("source");

-- CreateIndex
CREATE INDEX "NotificationLog_createdAt_idx" ON "NotificationLog"("createdAt");

-- CreateIndex
CREATE INDEX "AvailabilityWindow_userNCarnet_idx" ON "AvailabilityWindow"("userNCarnet");

-- CreateIndex
CREATE INDEX "AvailabilityWindow_fromDateTime_toDateTime_idx" ON "AvailabilityWindow"("fromDateTime", "toDateTime");

-- CreateIndex
CREATE INDEX "NotificationAutomationRun_createdAt_idx" ON "NotificationAutomationRun"("createdAt");

-- CreateIndex
CREATE INDEX "NotificationAutomationRun_trigger_status_idx" ON "NotificationAutomationRun"("trigger", "status");

-- CreateIndex
CREATE INDEX "NotificationAutomationRun_correlationId_idx" ON "NotificationAutomationRun"("correlationId");

-- CreateIndex
CREATE INDEX "NotificationAutomationTaskRun_runId_taskKey_idx" ON "NotificationAutomationTaskRun"("runId", "taskKey");

-- CreateIndex
CREATE INDEX "NotificationAutomationTaskRun_createdAt_idx" ON "NotificationAutomationTaskRun"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserHoursSummary_userId_key" ON "UserHoursSummary"("userId");

-- CreateIndex
CREATE INDEX "FormulariCampanya_convocatoriaId_serviceMoment_idx" ON "FormulariCampanya"("convocatoriaId", "serviceMoment");

-- CreateIndex
CREATE INDEX "FormulariCampanya_dia_idx" ON "FormulariCampanya"("dia");

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_nCarnet_fkey" FOREIGN KEY ("nCarnet") REFERENCES "User"("nCarnet") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convocatoria" ADD CONSTRAINT "Convocatoria_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convocatoria" ADD CONSTRAINT "Convocatoria_convoTypeId_fkey" FOREIGN KEY ("convoTypeId") REFERENCES "ConvoType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Respuesta" ADD CONSTRAINT "Respuesta_convoId_fkey" FOREIGN KEY ("convoId") REFERENCES "Convocatoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Respuesta" ADD CONSTRAINT "Respuesta_userNCarnet_fkey" FOREIGN KEY ("userNCarnet") REFERENCES "User"("nCarnet") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityWindow" ADD CONSTRAINT "AvailabilityWindow_userNCarnet_fkey" FOREIGN KEY ("userNCarnet") REFERENCES "User"("nCarnet") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationAutomationRun" ADD CONSTRAINT "NotificationAutomationRun_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationAutomationTaskRun" ADD CONSTRAINT "NotificationAutomationTaskRun_runId_fkey" FOREIGN KEY ("runId") REFERENCES "NotificationAutomationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserHoursSummary" ADD CONSTRAINT "UserHoursSummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormulariCampanya" ADD CONSTRAINT "FormulariCampanya_convocatoriaId_fkey" FOREIGN KEY ("convocatoriaId") REFERENCES "Convocatoria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

