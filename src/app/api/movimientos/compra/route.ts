import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import {
  fechaAPeriodo,
  calcularCostoUnitarioCompra,
  calcularSubtotalLinea,
  distribuirEnvioProporcional,
  calcularCostoUnitarioReal,
  calcularCostoPromedioPonderado,
} from "@/lib/calculations";
import { obtenerStockActual } from "@/lib/stock";

const lineaSchema = z.object({
  productoId: z.string(),
  cantidad: z.number().int().positive(),
  costoUnitarioCompra: z.number().int().nonnegative().optional(),
  totalLineaCompra: z.number().int().nonnegative().optional(),
});

const compraSchema = z.object({
  fecha: z.string(),
  motivo: z.string().min(1),
  notas: z.string().optional(),
  compraId: z.string().optional(),
  envioTotalCompra: z.number().int().nonnegative().optional(),
  lineas: z.array(lineaSchema).min(1),
});

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

// Registra todas las lineas de una misma compra (ingreso de stock) juntas,
// en una sola transaccion. Prorratea el envio una unica vez sobre el
// conjunto completo de lineas, evitando el problema de cargar linea por
// linea: la primera linea cargada se quedaria con todo el envio a su
// nombre porque en ese momento era la unica que existia.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = compraSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const productoIds = data.lineas.map((l) => l.productoId);
  const productos = await prisma.producto.findMany({ where: { id: { in: productoIds } } });
  const productoPorId = new Map(productos.map((p) => [p.id, p]));

  for (const id of productoIds) {
    if (!productoPorId.has(id)) {
      return NextResponse.json({ error: `Producto no encontrado: ${id}` }, { status: 404 });
    }
  }

  const fecha = new Date(data.fecha);
  const periodo = fechaAPeriodo(fecha);
  const compraId = data.compraId || `COMPRA-${Date.now()}`;

  const lineasCalculadas = data.lineas.map((linea) => {
    let costoUnitarioCompra = linea.costoUnitarioCompra ?? null;
    if (linea.totalLineaCompra != null) {
      costoUnitarioCompra = calcularCostoUnitarioCompra(linea.totalLineaCompra, linea.cantidad);
    }
    const subtotalLinea = calcularSubtotalLinea(
      linea.totalLineaCompra ?? null,
      linea.cantidad,
      costoUnitarioCompra ?? 0
    );
    return { ...linea, costoUnitarioCompra, subtotalLinea };
  });

  const costosEnvio =
    data.envioTotalCompra != null
      ? distribuirEnvioProporcional(lineasCalculadas, data.envioTotalCompra)
      : lineasCalculadas.map(() => 0);

  const movimientos = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const creados = [];

    for (let i = 0; i < lineasCalculadas.length; i++) {
      const linea = lineasCalculadas[i];
      const producto = productoPorId.get(linea.productoId)!;
      const costoEnvioUnitario = costosEnvio[i];
      const costoUnitarioReal = calcularCostoUnitarioReal(
        linea.costoUnitarioCompra ?? 0,
        costoEnvioUnitario
      );

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
          motivo: data.motivo,
          notas: data.notas,
          compraId,
          costoUnitarioCompra: linea.costoUnitarioCompra,
          totalLineaCompra: linea.totalLineaCompra ?? null,
          subtotalLinea: linea.subtotalLinea,
          envioTotalCompra: data.envioTotalCompra ?? null,
          costoEnvioUnitario,
          costoUnitarioReal,
          stockProcesado: true,
        },
      });
      creados.push(m);

      if (costoUnitarioReal > 0) {
        // Se recalcula en cada iteracion (no se puede pre-computar antes del
        // loop) porque si dos lineas de la misma compra son el mismo
        // producto, la segunda tiene que ver el stock que dejo la primera.
        const stockAntes = await obtenerStockActual(tx, linea.productoId);
        const costoAnterior = producto.costoActual;
        const nuevoCostoPromedio = calcularCostoPromedioPonderado(
          stockAntes,
          costoAnterior,
          linea.cantidad,
          costoUnitarioReal
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
  });

  return NextResponse.json({ compraId, movimientos }, { status: 201 });
}
