-- CreateTable
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "temporada" TEXT NOT NULL,
    "genero" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "talle" TEXT NOT NULL,
    "costoActual" INTEGER NOT NULL DEFAULT 0,
    "precioVenta" INTEGER NOT NULL DEFAULT 0,
    "stockMinimo" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productoId" TEXT NOT NULL,
    "stockInicial" INTEGER NOT NULL DEFAULT 0,
    "alertaMinimo" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Stock_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MovimientoStock" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "stockProcesado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MovimientoStock_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fecha" DATETIME NOT NULL,
    "periodo" TEXT NOT NULL,
    "cliente" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "temporada" TEXT NOT NULL,
    "genero" TEXT NOT NULL,
    "productoNombre" TEXT NOT NULL,
    "talle" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "costoUnitario" INTEGER NOT NULL,
    "costoTotal" INTEGER NOT NULL,
    "metodoPago" TEXT NOT NULL,
    "precioUnitario" INTEGER NOT NULL,
    "precioTotal" INTEGER NOT NULL,
    "ganancia" INTEGER NOT NULL,
    "sena" INTEGER NOT NULL DEFAULT 0,
    "saldoRestante" INTEGER NOT NULL,
    "estadoPedido" TEXT NOT NULL DEFAULT 'POR_PEDIR',
    "estadoPago" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "stockDescontado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pedido_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HistorialPrecios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productoId" TEXT NOT NULL,
    "temporada" TEXT NOT NULL,
    "genero" TEXT NOT NULL,
    "productoNombre" TEXT NOT NULL,
    "talle" TEXT NOT NULL,
    "costoAnterior" INTEGER NOT NULL,
    "costoNuevo" INTEGER NOT NULL,
    "precioAnterior" INTEGER NOT NULL,
    "precioNuevo" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    CONSTRAINT "HistorialPrecios_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Producto_temporada_genero_nombre_talle_key" ON "Producto"("temporada", "genero", "nombre", "talle");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_productoId_key" ON "Stock"("productoId");
