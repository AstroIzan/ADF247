-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nCarnet" TEXT NOT NULL,
    "nIndicatiu" TEXT,
    "name" TEXT NOT NULL,
    "lastName" TEXT,
    "password" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Role" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nCarnet" TEXT NOT NULL,
    "isCapOperatiu" BOOLEAN NOT NULL DEFAULT false,
    "isCapColla" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isGroc" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Role_nCarnet_fkey" FOREIGN KEY ("nCarnet") REFERENCES "User" ("nCarnet") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConvoType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Convocatoria" (
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
    CONSTRAINT "Convocatoria_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Convocatoria_convoTypeId_fkey" FOREIGN KEY ("convoTypeId") REFERENCES "ConvoType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Respuesta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "convoId" INTEGER NOT NULL,
    "userNCarnet" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "customText" TEXT,
    "fullHorari" BOOLEAN NOT NULL DEFAULT false,
    "response" BOOLEAN NOT NULL,
    CONSTRAINT "Respuesta_convoId_fkey" FOREIGN KEY ("convoId") REFERENCES "Convocatoria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Respuesta_userNCarnet_fkey" FOREIGN KEY ("userNCarnet") REFERENCES "User" ("nCarnet") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_nCarnet_key" ON "User"("nCarnet");

-- CreateIndex
CREATE UNIQUE INDEX "ConvoType_name_key" ON "ConvoType"("name");
