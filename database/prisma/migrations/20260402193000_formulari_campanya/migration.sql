CREATE TABLE "FormulariCampanya" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "convocatoriaId" INTEGER NOT NULL,
  "dia" DATETIME NOT NULL,
  "responsableId" INTEGER,
  "responsableNCarnet" TEXT,
  "voluntarisJson" TEXT NOT NULL,
  "vehiclesJson" TEXT NOT NULL,
  "serviceMoment" TEXT NOT NULL,
  "createdByNCarnet" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "FormulariCampanya_convocatoriaId_fkey"
    FOREIGN KEY ("convocatoriaId") REFERENCES "Convocatoria" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "FormulariCampanya_convocatoriaId_serviceMoment_idx"
  ON "FormulariCampanya"("convocatoriaId", "serviceMoment");

CREATE INDEX "FormulariCampanya_dia_idx"
  ON "FormulariCampanya"("dia");
