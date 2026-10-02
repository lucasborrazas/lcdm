import type { Prisma, Producto } from "@/generated/prisma/client";
import {
  calcularCostoPromedioPonderado,
  calcularLineasCompra,
  type LineaCompraEntrada,
  type LineaCompraCalculada,
} from "./calculations";
import { obtenerStockActual } from "./stock";
import { calcularImpacto, type EventoCosto, type ImpactoProducto } from "./recalculoCosto";

/**
 * Crea los MovimientoStock de una compra ya calculada (ver
 * calcularLineasCompra) dentro de una transacción, actualizando el costo
 * promedio ponderado de cada producto y dejando el registro en
 * HistorialPrecios. La usan tanto crear una compra nueva como aplicar una
 * edición (que por dentro borra la vieja y vuelve a crear con los datos
 * corregidos).
 */
export async function crearLineasDeCompra(
  tx: Prisma.TransactionClient,
  params: {
    fecha: Date;
    periodo: string;
    motivo: string;
    notas?: string;
    compraId: string;
    envioTotalCompra: number | null;
    lineasCalculadas: LineaCompraCalculada[];
    productoPorId: Map<string, Producto>;
    // false cuando quien llama (una edición) ya va a fijar el costoActual
    // final con aplicarImpactos — evita que este loop escriba un costo
    // intermedio (incorrecto, calculado sin tener en cuenta toda la
    // historia) que después quedaría pisado de todos modos.
    actualizarCosto?: boolean;
  }
) {
  const {
    fecha, periodo, motivo, notas, compraId, envioTotalCompra, lineasCalculadas, productoPorId,
    actualizarCosto = true,
  } = params;
  const creados = [];

  for (const linea of lineasCalculadas) {
    const producto = productoPorId.get(linea.productoId)!;

    // El stock "antes" se calcula ANTES de crear el movimiento de esta
    // linea (si no, se cuenta la propia linea dos veces: una como "stock
    // existente" y otra como "cantidad nueva" en el promedio ponderado).
    // Igual ve el stock que dejaron lineas anteriores de esta misma compra
    // si son el mismo producto, porque esas ya quedaron creadas arriba.
    const stockAntes = actualizarCosto && linea.costoUnitarioReal > 0
      ? await obtenerStockActual(tx, linea.productoId)
      : 0;

    const m = await tx.movimientoStock.create({
      data: {
        fecha,
        periodo,
        productoId: linea.productoId,
        temporada: producto.temporada,
        genero: producto.genero,
        productoNombre: producto.nombre,
        talle: producto.talle,
        tipo: "INGRESO",
        cantidad: linea.cantidad,
        motivo,
        notas,
        compraId,
        costoUnitarioCompra: linea.costoUnitarioCompra,
        totalLineaCompra: linea.totalLineaCompra ?? null,
        subtotalLinea: linea.subtotalLinea,
        envioTotalCompra: envioTotalCompra ?? null,
        costoEnvioUnitario: linea.costoEnvioUnitario,
        costoUnitarioReal: linea.costoUnitarioReal,
        stockProcesado: true,
      },
    });
    creados.push(m);

    if (actualizarCosto && linea.costoUnitarioReal > 0) {
      const costoAnterior = producto.costoActual;
      const nuevoCostoPromedio = calcularCostoPromedioPonderado(
        stockAntes,
        costoAnterior,
        linea.cantidad,
        linea.costoUnitarioReal
      );

      await tx.producto.update({
        where: { id: linea.productoId },
        data: { costoActual: nuevoCostoPromedio },
      });
      await tx.historialPrecios.create({
        data: {
          productoId: producto.id,
          temporada: producto.temporada,
          genero: producto.genero,
          productoNombre: producto.nombre,
          talle: producto.talle,
          costoAnterior: costoAnterior ?? 0,
          costoNuevo: nuevoCostoPromedio,
          precioAnterior: producto.precioVenta,
          precioNuevo: producto.precioVenta,
          motivo: "Cambio automático por ingreso de stock (promedio ponderado)",
        },
      });
      // Mantiene el costoActual en memoria al dia por si otra linea de
      // esta misma compra vuelve a tocar el mismo producto.
      producto.costoActual = nuevoCostoPromedio;
    }
  }

  return creados;
}

/**
 * Borra todas las líneas de una compra (MovimientoStock con ese compraId),
 * dejando un snapshot de auditoría en MovimientoEliminado por cada una.
 */
export async function eliminarLineasDeCompra(tx: Prisma.TransactionClient, compraId: string) {
  const movimientos = await tx.movimientoStock.findMany({ where: { compraId, tipo: "INGRESO" } });

  for (const m of movimientos) {
    await tx.movimientoEliminado.create({
      data: {
        movimientoIdOriginal: m.id,
        fecha: m.fecha,
        periodo: m.periodo,
        productoId: m.productoId,
        temporada: m.temporada,
        genero: m.genero,
        productoNombre: m.productoNombre,
        talle: m.talle,
        tipo: m.tipo,
        cantidad: m.cantidad,
        motivo: m.motivo,
        notas: m.notas,
        compraId: m.compraId,
        costoUnitarioCompra: m.costoUnitarioCompra,
        totalLineaCompra: m.totalLineaCompra,
        subtotalLinea: m.subtotalLinea,
        envioTotalCompra: m.envioTotalCompra,
        costoEnvioUnitario: m.costoEnvioUnitario,
        costoUnitarioReal: m.costoUnitarioReal,
      },
    });
  }

  await tx.movimientoStock.deleteMany({ where: { compraId, tipo: "INGRESO" } });

  return movimientos;
}

/**
 * Calcula qué le pasaría al costo de cada producto afectado si se borrara
 * esta compra, sin escribir nada. Es lo que se usa tanto para el preview
 * como, justo antes de aplicar de verdad, para saber qué escribir.
 */
export async function calcularImpactosEliminarCompra(
  tx: Prisma.TransactionClient,
  compraId: string
): Promise<{ movimientos: Awaited<ReturnType<typeof obtenerMovimientosCompra>>; impactos: ImpactoProducto[] }> {
  const movimientos = await obtenerMovimientosCompra(tx, compraId);
  const productoIds = Array.from(new Set(movimientos.map((m) => m.productoId)));
  const idsAExcluir = new Set(movimientos.map((m) => m.id));

  const impactos: ImpactoProducto[] = [];
  for (const productoId of productoIds) {
    impactos.push(await calcularImpacto(tx, productoId, { excluirMovimientoIds: idsAExcluir }));
  }

  return { movimientos, impactos };
}

function obtenerMovimientosCompra(tx: Prisma.TransactionClient, compraId: string) {
  return tx.movimientoStock.findMany({ where: { compraId, tipo: "INGRESO" } });
}

/**
 * Calcula qué le pasaría al costo de cada producto afectado (tanto los de
 * la compra vieja como los de la nueva versión) si se reemplazaran las
 * líneas de esta compra por las nuevas, sin escribir nada todavía.
 */
export async function calcularImpactosEditarCompra(
  tx: Prisma.TransactionClient,
  compraId: string,
  nuevo: {
    lineas: LineaCompraEntrada[];
    envioTotalCompra?: number | null;
    valorGeneralCompra?: number | null;
  }
): Promise<{
  movimientosViejos: Awaited<ReturnType<typeof obtenerMovimientosCompra>>;
  lineasCalculadas: LineaCompraCalculada[];
  impactos: ImpactoProducto[];
  productoPorId: Map<string, Producto>;
}> {
  const movimientosViejos = await obtenerMovimientosCompra(tx, compraId);
  const idsAExcluir = new Set(movimientosViejos.map((m) => m.id));

  const productoIdsNuevos = nuevo.lineas.map((l) => l.productoId);
  const productos = await tx.producto.findMany({ where: { id: { in: productoIdsNuevos } } });
  const productoPorId = new Map(productos.map((p) => [p.id, p]));
  for (const id of productoIdsNuevos) {
    if (!productoPorId.has(id)) throw new Error(`Producto no encontrado: ${id}`);
  }

  const lineasCalculadas = calcularLineasCompra(nuevo.lineas, nuevo.envioTotalCompra, nuevo.valorGeneralCompra);

  // Las lineas nuevas se simulan como una compra recien hecha: van al final
  // de la linea de tiempo de cada producto afectado.
  const ahora = Date.now();
  const eventosAdicionalesPorProducto = new Map<string, EventoCosto[]>();
  lineasCalculadas.forEach((l, i) => {
    if (l.costoUnitarioReal <= 0) return;
    const arr = eventosAdicionalesPorProducto.get(l.productoId) ?? [];
    arr.push({
      tipo: "INGRESO",
      ts: ahora + i,
      movimientoId: `nuevo-${i}`,
      cantidad: l.cantidad,
      costoUnitarioReal: l.costoUnitarioReal,
    });
    eventosAdicionalesPorProducto.set(l.productoId, arr);
  });

  const productoIdsAfectados = Array.from(
    new Set([...movimientosViejos.map((m) => m.productoId), ...productoIdsNuevos])
  );

  const impactos: ImpactoProducto[] = [];
  for (const productoId of productoIdsAfectados) {
    impactos.push(
      await calcularImpacto(tx, productoId, {
        excluirMovimientoIds: idsAExcluir,
        eventosAdicionales: eventosAdicionalesPorProducto.get(productoId) ?? [],
      })
    );
  }

  return { movimientosViejos, lineasCalculadas, impactos, productoPorId };
}

/** Escribe en la base los impactos que realmente cambian algo. */
export async function aplicarImpactos(tx: Prisma.TransactionClient, impactos: ImpactoProducto[]) {
  for (const impacto of impactos) {
    if (impacto.costoNuevo === impacto.costoAnterior) continue;

    const producto = await tx.producto.findUnique({ where: { id: impacto.productoId } });
    if (!producto) continue;

    await tx.producto.update({
      where: { id: impacto.productoId },
      data: { costoActual: impacto.costoNuevo },
    });
    await tx.historialPrecios.create({
      data: {
        productoId: producto.id,
        temporada: producto.temporada,
        genero: producto.genero,
        productoNombre: producto.nombre,
        talle: producto.talle,
        costoAnterior: impacto.costoAnterior ?? 0,
        costoNuevo: impacto.costoNuevo ?? 0,
        precioAnterior: producto.precioVenta,
        precioNuevo: producto.precioVenta,
        motivo: "Recálculo automático por edición/eliminación de una compra",
      },
    });
  }
}
