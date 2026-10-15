-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FamiliaEntrega" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "turnoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "metodoPago" TEXT,
    "monto" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FamiliaEntrega_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES "TurnoEntrega" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FamiliaEntrega" ("createdAt", "id", "metodoPago", "monto", "nombre", "turnoId", "updatedAt") SELECT "createdAt", "id", "metodoPago", "monto", "nombre", "turnoId", "updatedAt" FROM "FamiliaEntrega";
DROP TABLE "FamiliaEntrega";
ALTER TABLE "new_FamiliaEntrega" RENAME TO "FamiliaEntrega";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

