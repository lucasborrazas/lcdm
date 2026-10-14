-- CreateTable
CREATE TABLE "PlantillaHorario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "seccion" TEXT NOT NULL,
    "hora" TEXT NOT NULL,
    "grupoEdadId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlantillaHorario_grupoEdadId_fkey" FOREIGN KEY ("grupoEdadId") REFERENCES "GrupoEdad" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Configuracion" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "indumentariaActiva" BOOLEAN NOT NULL DEFAULT true,
    "torneoActivo" BOOLEAN NOT NULL DEFAULT true,
    "premiosActivo" BOOLEAN NOT NULL DEFAULT false,
    "precioTorneoEfectivo" INTEGER NOT NULL DEFAULT 18000,
    "precioTorneoTransferencia" INTEGER NOT NULL DEFAULT 22000,
    "bonoPrecioTransferencia" INTEGER NOT NULL DEFAULT 48000,
    "bonoDescuentoEfectivoPct" INTEGER NOT NULL DEFAULT 15,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Configuracion" ("id", "indumentariaActiva", "premiosActivo", "torneoActivo", "updatedAt") SELECT "id", "indumentariaActiva", "premiosActivo", "torneoActivo", "updatedAt" FROM "Configuracion";
DROP TABLE "Configuracion";
ALTER TABLE "new_Configuracion" RENAME TO "Configuracion";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Plantilla inicial de la entrega de premios: los 5 turnos de siempre.
INSERT INTO "PlantillaHorario" ("id", "seccion", "hora") VALUES
    ('plantilla-premios-1600', 'PREMIOS', '16:00'),
    ('plantilla-premios-1640', 'PREMIOS', '16:40'),
    ('plantilla-premios-1720', 'PREMIOS', '17:20'),
    ('plantilla-premios-1800', 'PREMIOS', '18:00'),
    ('plantilla-premios-1840', 'PREMIOS', '18:40');
