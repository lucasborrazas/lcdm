-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Producto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "temporada" TEXT NOT NULL,
    "genero" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "talle" TEXT NOT NULL,
    "costoActual" INTEGER,
    "precioVenta" INTEGER NOT NULL DEFAULT 0,
    "stockMinimo" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Producto" ("costoActual", "createdAt", "genero", "id", "nombre", "precioVenta", "stockMinimo", "talle", "temporada", "updatedAt") SELECT "costoActual", "createdAt", "genero", "id", "nombre", "precioVenta", "stockMinimo", "talle", "temporada", "updatedAt" FROM "Producto";
DROP TABLE "Producto";
ALTER TABLE "new_Producto" RENAME TO "Producto";
CREATE UNIQUE INDEX "Producto_temporada_genero_nombre_talle_key" ON "Producto"("temporada", "genero", "nombre", "talle");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
