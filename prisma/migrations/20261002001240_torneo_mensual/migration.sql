/*
  Warnings:

  - You are about to drop the column `descripcion` on the `Horario` table. All the data in the column will be lost.
  - Added the required column `grupoEdadId` to the `Horario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `torneoId` to the `Horario` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "GrupoEdad" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Torneo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PLANIFICADO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Horario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "torneoId" TEXT NOT NULL,
    "grupoEdadId" TEXT NOT NULL,
    "hora" TEXT NOT NULL,
    "cupoMaximo" INTEGER,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Horario_torneoId_fkey" FOREIGN KEY ("torneoId") REFERENCES "Torneo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Horario_grupoEdadId_fkey" FOREIGN KEY ("grupoEdadId") REFERENCES "GrupoEdad" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Horario" ("activo", "createdAt", "cupoMaximo", "hora", "id", "orden", "updatedAt") SELECT "activo", "createdAt", "cupoMaximo", "hora", "id", "orden", "updatedAt" FROM "Horario";
DROP TABLE "Horario";
ALTER TABLE "new_Horario" RENAME TO "Horario";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "GrupoEdad_nombre_key" ON "GrupoEdad"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Torneo_mes_anio_key" ON "Torneo"("mes", "anio");
