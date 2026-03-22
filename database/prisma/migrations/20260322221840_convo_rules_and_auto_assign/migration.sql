-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ConvoType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "minGrocSortida" INTEGER NOT NULL DEFAULT 0,
    "minVerdSortida" INTEGER NOT NULL DEFAULT 0,
    "defaultLocation" TEXT
);
INSERT INTO "new_ConvoType" ("id", "name") SELECT "id", "name" FROM "ConvoType";
DROP TABLE "ConvoType";
ALTER TABLE "new_ConvoType" RENAME TO "ConvoType";
CREATE UNIQUE INDEX "ConvoType_name_key" ON "ConvoType"("name");
CREATE TABLE "new_Convocatoria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "ubiSortida" TEXT NOT NULL,
    "responsableId" INTEGER NOT NULL,
    "convoTypeId" INTEGER NOT NULL,
    "moreThan2" BOOLEAN NOT NULL DEFAULT false,
    "startTime" DATETIME NOT NULL,
    "finalTime" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "autoAssignResponsable" BOOLEAN NOT NULL DEFAULT false,
    "sortida" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Convocatoria_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Convocatoria_convoTypeId_fkey" FOREIGN KEY ("convoTypeId") REFERENCES "ConvoType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Convocatoria" ("convoTypeId", "date", "finalTime", "id", "isActive", "moreThan2", "responsableId", "startTime", "title", "ubiSortida") SELECT "convoTypeId", "date", "finalTime", "id", "isActive", "moreThan2", "responsableId", "startTime", "title", "ubiSortida" FROM "Convocatoria";
DROP TABLE "Convocatoria";
ALTER TABLE "new_Convocatoria" RENAME TO "Convocatoria";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
