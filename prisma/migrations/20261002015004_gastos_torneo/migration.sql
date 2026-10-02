-- CreateTable
CREATE TABLE "GastoTorneo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "torneoId" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GastoTorneo_torneoId_fkey" FOREIGN KEY ("torneoId") REFERENCES "Torneo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
