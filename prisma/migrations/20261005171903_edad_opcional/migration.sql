-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InscripcionTorneo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "edad" TEXT,
    "horarioId" TEXT NOT NULL,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "metodoPago" TEXT,
    "monto" INTEGER,
    "equipo" TEXT,
    "equipoAsignadoAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InscripcionTorneo_horarioId_fkey" FOREIGN KEY ("horarioId") REFERENCES "Horario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_InscripcionTorneo" ("createdAt", "edad", "equipo", "equipoAsignadoAt", "horarioId", "id", "metodoPago", "monto", "nombre", "pago", "updatedAt") SELECT "createdAt", "edad", "equipo", "equipoAsignadoAt", "horarioId", "id", "metodoPago", "monto", "nombre", "pago", "updatedAt" FROM "InscripcionTorneo";
DROP TABLE "InscripcionTorneo";
ALTER TABLE "new_InscripcionTorneo" RENAME TO "InscripcionTorneo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
