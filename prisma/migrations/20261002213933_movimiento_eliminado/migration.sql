-- CreateTable
CREATE TABLE "MovimientoEliminado" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "movimientoIdOriginal" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "periodo" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "temporada" TEXT NOT NULL,
    "genero" TEXT NOT NULL,
    "productoNombre" TEXT NOT NULL,
    "talle" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "notas" TEXT,
    "compraId" TEXT,
    "costoUnitarioCompra" INTEGER,
    "totalLineaCompra" INTEGER,
    "subtotalLinea" INTEGER,
    "envioTotalCompra" INTEGER,
    "costoEnvioUnitario" INTEGER,
    "costoUnitarioReal" INTEGER,
    "eliminadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
