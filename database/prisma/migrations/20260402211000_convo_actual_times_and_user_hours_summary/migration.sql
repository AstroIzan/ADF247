ALTER TABLE "Convocatoria" ADD COLUMN "actualStartTime" DATETIME;
ALTER TABLE "Convocatoria" ADD COLUMN "actualEndTime" DATETIME;

CREATE TABLE "UserHoursSummary" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "userId" INTEGER NOT NULL,
  "campaignHours" REAL NOT NULL DEFAULT 0,
  "offCampaignHours" REAL NOT NULL DEFAULT 0,
  "unansweredCount" INTEGER NOT NULL DEFAULT 0,
  "noShowCount" INTEGER NOT NULL DEFAULT 0,
  "unansweredPenaltyHours" REAL NOT NULL DEFAULT 0,
  "noShowPenaltyHours" REAL NOT NULL DEFAULT 0,
  "totalHours" REAL NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "UserHoursSummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "UserHoursSummary_userId_key" ON "UserHoursSummary"("userId");
