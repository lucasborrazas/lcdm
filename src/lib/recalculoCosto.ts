import type { Prisma } from "@/generated/prisma/client";
import { calcularCostoPromedioPonderado } from "./calculations";

export type EventoCosto =
  | { tipo: "INGRESO"; ts: number; movimientoId: string; cantidad: number; costoUnitarioReal: number }
  | { tipo: "EGRESO"; ts: number; movimientoId: string; cantidad: number }
  | { tipo: "PEDIDO"; ts: number; pedidoId: string; cantidad: number }
  | { tipo: "MANUAL"; ts: number; costoNuevo: number };

/**
 * Reproduce, en orden cronológico real, todo lo que le pasó al stock y al
 * costo promedio ponderado de un producto: ingresos (suman stock y afectan
 * el promedio), egresos y ventas (solo restan stock, no tocan el costo) y
 * cambios manuales de costo (lo pisan directo). Es una función pura para
 * poder testearla sin tocar la base — las consultas viven aparte.
 */
export function replayCosto(
  stockInicial: number,
  costoSemilla: number | null,
  eventos: EventoCosto[]
): { stock: number; costo: number | null } {
  let stock = stockInicial;
  let costo = costoSemilla;

  const ordenados = [...eventos].sort((a, b) => a.ts - b.ts);

  for (const ev of ordenados) {
    if (ev.tipo === "MANUAL") {
      costo = ev.costoNuevo;
    } else if (ev.tipo === "INGRESO") {
      if (ev.costoUnitarioReal > 0) {
        costo = calcularCostoPromedioPonderado(stock, costo, ev.cantidad, ev.costoUnitarioReal);
      }
      stock += ev.cantidad;
    } else {
      // EGRESO o PEDIDO: solo restan stock, el costo promedio no se diluye por vender.
      stock -= ev.cantidad;
    }
  }

  return { stock, costo };
}

/**
 * Junta, para un producto, la semilla de costo (el valor que tenía antes de
 * que cualquier cambio automático o manual lo empezara a pisar) y la lista
 * completa de eventos que le afectaron costo o stock a lo largo del tiempo.
 * `excluirMovimientoIds` permite simular "como si esta compra no hubiera
 * pasado", sin borrar nada todavía (sirve tanto para el preview como para
 * el recalculo real, que la llama justo antes de borrar).
 */
export async function obtenerSemillaYEventos(
  tx: Prisma.TransactionClient,
  productoId: string,
  excluirMovimientoIds: Set<string> = new Set()
): Promise<{ stockInicial: number; costoSemilla: number | null; eventos: EventoCosto[] }> {
  const producto = await tx.producto.findUnique({
    where: { id: productoId },
    include: { stock: true },
  });
  if (!producto) throw new Error(`Producto no encontrado: ${productoId}`);

  const stockInicial = producto.stock?.stockInicial ?? 0;

  const primerHistorial = await tx.historialPrecios.findFirst({
    where: { productoId },
    orderBy: { fecha: "asc" },
  });
  const costoSemilla = primerHistorial ? primerHistorial.costoAnterior : producto.costoActual;

  const [movimientos, manuales, pedidos] = await Promise.all([
    tx.movimientoStock.findMany({
      where: { productoId, stockProcesado: true },
      orderBy: { createdAt: "asc" },
    }),
    tx.historialPrecios.findMany({
      where: { productoId, motivo: { startsWith: "Cambio manual" } },
      orderBy: { fecha: "asc" },
    }),
    tx.pedido.findMany({
      where: { productoId, stockDescontado: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const eventos: EventoCosto[] = [];

  for (const m of movimientos) {
    if (excluirMovimientoIds.has(m.id)) continue;
    if (m.tipo === "INGRESO") {
      eventos.push({
        tipo: "INGRESO",
        ts: m.createdAt.getTime(),
        movimientoId: m.id,
        cantidad: m.cantidad,
        costoUnitarioReal: m.costoUnitarioReal ?? 0,
      });
    } else {
      eventos.push({ tipo: "EGRESO", ts: m.createdAt.getTime(), movimientoId: m.id, cantidad: m.cantidad });
    }
  }

  for (const h of manuales) {
    eventos.push({ tipo: "MANUAL", ts: h.fecha.getTime(), costoNuevo: h.costoNuevo });
  }

  for (const p of pedidos) {
    eventos.push({ tipo: "PEDIDO", ts: p.createdAt.getTime(), pedidoId: p.id, cantidad: p.cantidad });
  }

  return { stockInicial, costoSemilla, eventos };
}

export type ImpactoProducto = {
  productoId: string;
  productoNombre: string;
  talle: string;
  costoAnterior: number | null;
  costoNuevo: number | null;
};

/**
 * Calcula cuánto cambiaría el costo promedio de un producto si se excluyen
 * ciertos movimientos (por ejemplo, los de una compra que se va a borrar) y,
 * opcionalmente, se agregan eventos nuevos al final (una compra editada).
 * No escribe nada en la base — sirve tanto para el preview como paso previo
 * a aplicar el cambio real.
 */
export async function calcularImpacto(
  tx: Prisma.TransactionClient,
  productoId: string,
  opts: { excluirMovimientoIds?: Set<string>; eventosAdicionales?: EventoCosto[] } = {}
): Promise<ImpactoProducto> {
  const producto = await tx.producto.findUnique({ where: { id: productoId } });
  if (!producto) throw new Error(`Producto no encontrado: ${productoId}`);

  const { stockInicial, costoSemilla, eventos } = await obtenerSemillaYEventos(
    tx,
    productoId,
    opts.excluirMovimientoIds ?? new Set()
  );
  const todosEventos = [...eventos, ...(opts.eventosAdicionales ?? [])];
  const resultado = replayCosto(stockInicial, costoSemilla, todosEventos);

  return {
    productoId,
    productoNombre: producto.nombre,
    talle: producto.talle,
    costoAnterior: producto.costoActual,
    costoNuevo: resultado.costo,
  };
}
