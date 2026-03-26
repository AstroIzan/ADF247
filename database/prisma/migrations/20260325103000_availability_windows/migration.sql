-- CreateTable
CREATE TABLE "AvailabilityWindow" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userNCarnet" TEXT NOT NULL,
    "fromDateTime" DATETIME NOT NULL,
    "toDateTime" DATETIME NOT NULL,
    "availabilityType" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AvailabilityWindow_userNCarnet_fkey" FOREIGN KEY ("userNCarnet") REFERENCES "User" ("nCarnet") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AvailabilityWindow_userNCarnet_idx" ON "AvailabilityWindow"("userNCarnet");

-- CreateIndex
CREATE INDEX "AvailabilityWindow_fromDateTime_toDateTime_idx" ON "AvailabilityWindow"("fromDateTime", "toDateTime");
