-- CreateTable
CREATE TABLE "EntregaPremios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "anio" INTEGER NOT NULL,
    "precioTransferencia" INTEGER NOT NULL DEFAULT 48000,
    "precioEfectivo" INTEGER NOT NULL DEFAULT 40000,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TurnoEntrega" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entregaId" TEXT NOT NULL,
    "hora" TEXT NOT NULL,
    "grupoEdadId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TurnoEntrega_entregaId_fkey" FOREIGN KEY ("entregaId") REFERENCES "EntregaPremios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TurnoEntrega_grupoEdadId_fkey" FOREIGN KEY ("grupoEdadId") REFERENCES "GrupoEdad" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FamiliaEntrega" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "turnoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "totalPersonas" INTEGER NOT NULL,
    "metodoPago" TEXT,
    "monto" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FamiliaEntrega_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES "TurnoEntrega" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChicoEntrega" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familiaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "genero" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChicoEntrega_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "FamiliaEntrega" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GastoEntrega" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entregaId" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GastoEntrega_entregaId_fkey" FOREIGN KEY ("entregaId") REFERENCES "EntregaPremios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Configuracion" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "indumentariaActiva" BOOLEAN NOT NULL DEFAULT true,
    "torneoActivo" BOOLEAN NOT NULL DEFAULT true,
    "premiosActivo" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Configuracion" ("id", "indumentariaActiva", "torneoActivo", "updatedAt") SELECT "id", "indumentariaActiva", "torneoActivo", "updatedAt" FROM "Configuracion";
DROP TABLE "Configuracion";
ALTER TABLE "new_Configuracion" RENAME TO "Configuracion";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "EntregaPremios_anio_key" ON "EntregaPremios"("anio");
