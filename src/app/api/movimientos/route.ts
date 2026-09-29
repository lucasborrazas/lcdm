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

const movimientoSchema = z.object({
  fecha: z.string(),
  productoId: z.string(),
  tipo: z.enum(["INGRESO", "EGRESO"]),
  cantidad: z.number().int().positive(),
  motivo: z.string().min(1),
  notas: z.string().optional(),
  compraId: z.string().optional(),
  costoUnitarioCompra: z.number().int().nonnegative().optional(),
  totalLineaCompra: z.number().int().nonnegative().optional(),
  envioTotalCompra: z.number().int().nonnegative().optional(),
});

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET() {
  const movimientos = await prisma.movimientoStock.findMany({
    include: { producto: true },
    orderBy: { fecha: "desc" },
  });
  return NextResponse.json(movimientos);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = movimientoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const producto = await prisma.producto.findUnique({ where: { id: data.productoId } });
  if (!producto) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  const fecha = new Date(data.fecha);
  const periodo = fechaAPeriodo(fecha);

  let costoUnitarioCompraFinal = data.costoUnitarioCompra ?? null;
  let subtotalLinea: number | null = null;
  let costoEnvioUnitario: number | null = null;
  let costoUnitarioReal: number | null = null;

  if (data.tipo === "INGRESO" && (data.totalLineaCompra != null || data.costoUnitarioCompra != null)) {
    if (data.totalLineaCompra != null) {
      costoUnitarioCompraFinal = calcularCostoUnitarioCompra(data.totalLineaCompra, data.cantidad);
    }
    subtotalLinea = calcularSubtotalLinea(data.totalLineaCompra ?? null, data.cantidad, costoUnitarioCompraFinal ?? 0);

    if (data.envioTotalCompra != null && data.compraId) {
      const otrasLineas = await prisma.movimientoStock.findMany({
        where: { compraId: data.compraId, stockProcesado: true },
      });

      const todasLineas = [
        ...otrasLineas.map((l) => ({ subtotalLinea: l.subtotalLinea ?? 0, cantidad: l.cantidad })),
        { subtotalLinea: subtotalLinea ?? 0, cantidad: data.cantidad },
      ];

      const distribuciones = distribuirEnvioProporcional(todasLineas, data.envioTotalCompra);
      costoEnvioUnitario = distribuciones[distribuciones.length - 1];
    } else if (data.envioTotalCompra != null) {
      costoEnvioUnitario = Math.round(data.envioTotalCompra / data.cantidad);
    }

    costoUnitarioReal = calcularCostoUnitarioReal(costoUnitarioCompraFinal ?? 0, costoEnvioUnitario ?? 0);
  }

  const movimiento = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    let nuevoCostoPromedio: number | null = null;
    if (data.tipo === "INGRESO" && costoUnitarioReal != null && costoUnitarioReal > 0) {
      const stockAntes = await obtenerStockActual(tx, data.productoId);
      nuevoCostoPromedio = calcularCostoPromedioPonderado(
        stockAntes,
        producto.costoActual,
        data.cantidad,
        costoUnitarioReal
      );
    }

    const m = await tx.movimientoStock.create({
      data: {
        fecha,
        periodo,
        productoId: data.productoId,
        temporada: producto.temporada,
        genero: producto.genero,
        productoNombre: producto.nombre,
        talle: producto.talle,
        tipo: data.tipo,
        cantidad: data.cantidad,
        motivo: data.motivo,
        notas: data.notas,
        compraId: data.compraId,
        costoUnitarioCompra: costoUnitarioCompraFinal,
        totalLineaCompra: data.totalLineaCompra ?? null,
        subtotalLinea,
        envioTotalCompra: data.envioTotalCompra ?? null,
        costoEnvioUnitario,
        costoUnitarioReal,
        stockProcesado: true,
      },
    });

    if (nuevoCostoPromedio != null) {
      const costoAnterior = producto.costoActual ?? 0;
      await tx.producto.update({
        where: { id: data.productoId },
        data: { costoActual: nuevoCostoPromedio },
      });
      await tx.historialPrecios.create({
        data: {
          productoId: producto.id,
          temporada: producto.temporada,
          genero: producto.genero,
          productoNombre: producto.nombre,
          talle: producto.talle,
          costoAnterior,
          costoNuevo: nuevoCostoPromedio,
          precioAnterior: producto.precioVenta,
          precioNuevo: producto.precioVenta,
          motivo: "Cambio automático por ingreso de stock (promedio ponderado)",
        },
      });
    }

    return m;
  });

  return NextResponse.json(movimiento, { status: 201 });
}
