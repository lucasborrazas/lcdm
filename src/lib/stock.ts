import type { Prisma } from "@/generated/prisma/client";

export async function obtenerStockActual(
  tx: Prisma.TransactionClient,
  productoId: string
): Promise<number> {
  const producto = await tx.producto.findUnique({
    where: { id: productoId },
    include: {
      stock: true,
      movimientos: { where: { stockProcesado: true } },
      pedidos: { where: { stockDescontado: true } },
    },
  });
  if (!producto) return 0;

  const ingresos = producto.movimientos
    .filter((m) => m.tipo === "INGRESO")
    .reduce((s, m) => s + m.cantidad, 0);
  const egresosMovimientos = producto.movimientos
    .filter((m) => m.tipo === "EGRESO")
    .reduce((s, m) => s + m.cantidad, 0);
  const egresosPedidos = producto.pedidos.reduce((s, p) => s + p.cantidad, 0);
  const stockInicial = producto.stock?.stockInicial ?? 0;

  return stockInicial + ingresos - egresosMovimientos - egresosPedidos;
}

// El stock se descuenta apenas el pedido se encarga (o entrega); en POR_PEDIR
// todavia no hay nada comprometido, asi que se puede pedir sin stock.
export function descuentaStock(estadoPedido: string): boolean {
  return estadoPedido === "ENCARGADO" || estadoPedido === "ENTREGADO";
}
