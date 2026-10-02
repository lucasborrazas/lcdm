import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { fechaAPeriodo, calcularLineasCompra } from "@/lib/calculations";
import {
  crearLineasDeCompra,
  eliminarLineasDeCompra,
  calcularImpactosEliminarCompra,
  calcularImpactosEditarCompra,
  aplicarImpactos,
} from "@/lib/compraStock";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const lineaSchema = z.object({
  productoId: z.string(),
  cantidad: z.number().int().positive(),
  costoUnitarioCompra: z.number().int().nonnegative().optional(),
  totalLineaCompra: z.number().int().nonnegative().optional(),
});

const editarSchema = z.object({
  fecha: z.string(),
  motivo: z.string().min(1),
  notas: z.string().optional(),
  envioTotalCompra: z.number().int().nonnegative().optional(),
  valorGeneralCompra: z.number().int().nonnegative().optional(),
  lineas: z.array(lineaSchema).min(1),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { compraId: string } }
) {
  const movimientos = await prisma.movimientoStock.findMany({
    where: { compraId: params.compraId, tipo: "INGRESO" },
    orderBy: { createdAt: "asc" },
  });
  if (movimientos.length === 0) {
    return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 });
  }
  return NextResponse.json(movimientos);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { compraId: string } }
) {
  const compraId = params.compraId;

  const resultado = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const { movimientos, impactos } = await calcularImpactosEliminarCompra(tx, compraId);
    if (movimientos.length === 0) return null;

    await eliminarLineasDeCompra(tx, compraId);
    await aplicarImpactos(tx, impactos);

    return { eliminados: movimientos.length, impactos: impactos.filter((i) => i.costoNuevo !== i.costoAnterior) };
  });

  if (!resultado) {
    return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 });
  }
  return NextResponse.json(resultado);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { compraId: string } }
) {
  const compraId = params.compraId;
  const body = await req.json();
  const parsed = editarSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const resultado = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const { movimientosViejos, lineasCalculadas, impactos, productoPorId } =
      await calcularImpactosEditarCompra(tx, compraId, {
        lineas: data.lineas,
        envioTotalCompra: data.envioTotalCompra,
        valorGeneralCompra: data.valorGeneralCompra,
      });
    if (movimientosViejos.length === 0) return null;

    await eliminarLineasDeCompra(tx, compraId);

    const fecha = new Date(data.fecha);
    const periodo = fechaAPeriodo(fecha);
    const nuevos = await crearLineasDeCompra(tx, {
      fecha,
      periodo,
      motivo: data.motivo,
      notas: data.notas,
      compraId,
      envioTotalCompra: data.envioTotalCompra ?? null,
      lineasCalculadas,
      productoPorId,
      actualizarCosto: false,
    });

    await aplicarImpactos(tx, impactos);

    return { movimientos: nuevos, impactos: impactos.filter((i) => i.costoNuevo !== i.costoAnterior) };
  });

  if (!resultado) {
    return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 });
  }
  return NextResponse.json(resultado);
}
