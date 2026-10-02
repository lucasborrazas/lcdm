-- CreateTable
CREATE TABLE "Horario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hora" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cupoMaximo" INTEGER,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InscripcionTorneo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "edad" TEXT NOT NULL,
    "horarioId" TEXT NOT NULL,
    "monto" INTEGER NOT NULL,
    "equipo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InscripcionTorneo_horarioId_fkey" FOREIGN KEY ("horarioId") REFERENCES "Horario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
