-- CreateTable
CREATE TABLE "PedidoGrupo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fecha" DATETIME NOT NULL,
    "periodo" TEXT NOT NULL,
    "cliente" TEXT NOT NULL,
    "metodoPago" TEXT NOT NULL,
    "precioTotal" INTEGER NOT NULL,
    "sena" INTEGER NOT NULL DEFAULT 0,
    "saldoRestante" INTEGER NOT NULL,
    "estadoPago" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pedido" (
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
    "pedidoGrupoId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pedido_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pedido_pedidoGrupoId_fkey" FOREIGN KEY ("pedidoGrupoId") REFERENCES "PedidoGrupo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Pedido" ("cantidad", "cliente", "costoTotal", "costoUnitario", "createdAt", "estadoPago", "estadoPedido", "fecha", "ganancia", "genero", "id", "metodoPago", "periodo", "precioTotal", "precioUnitario", "productoId", "productoNombre", "saldoRestante", "sena", "stockDescontado", "talle", "temporada", "updatedAt") SELECT "cantidad", "cliente", "costoTotal", "costoUnitario", "createdAt", "estadoPago", "estadoPedido", "fecha", "ganancia", "genero", "id", "metodoPago", "periodo", "precioTotal", "precioUnitario", "productoId", "productoNombre", "saldoRestante", "sena", "stockDescontado", "talle", "temporada", "updatedAt" FROM "Pedido";
DROP TABLE "Pedido";
ALTER TABLE "new_Pedido" RENAME TO "Pedido";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
