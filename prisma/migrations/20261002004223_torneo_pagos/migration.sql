/*
  Warnings:

  - You are about to drop the column `monto` on the `InscripcionTorneo` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InscripcionTorneo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "edad" TEXT NOT NULL,
    "horarioId" TEXT NOT NULL,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "metodoPago" TEXT,
    "equipo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InscripcionTorneo_horarioId_fkey" FOREIGN KEY ("horarioId") REFERENCES "Horario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_InscripcionTorneo" ("createdAt", "edad", "equipo", "horarioId", "id", "nombre", "updatedAt") SELECT "createdAt", "edad", "equipo", "horarioId", "id", "nombre", "updatedAt" FROM "InscripcionTorneo";
DROP TABLE "InscripcionTorneo";
ALTER TABLE "new_InscripcionTorneo" RENAME TO "InscripcionTorneo";
CREATE TABLE "new_Torneo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PLANIFICADO',
    "precioEfectivo" INTEGER NOT NULL DEFAULT 18000,
    "precioTransferencia" INTEGER NOT NULL DEFAULT 22000,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Torneo" ("anio", "createdAt", "estado", "id", "mes", "updatedAt") SELECT "anio", "createdAt", "estado", "id", "mes", "updatedAt" FROM "Torneo";
DROP TABLE "Torneo";
ALTER TABLE "new_Torneo" RENAME TO "Torneo";
CREATE UNIQUE INDEX "Torneo_mes_anio_key" ON "Torneo"("mes", "anio");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
