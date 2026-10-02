import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { calcularImpactosEliminarCompra, calcularImpactosEditarCompra } from "@/lib/compraStock";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const lineaSchema = z.object({
  productoId: z.string(),
  cantidad: z.number().int().positive(),
  costoUnitarioCompra: z.number().int().nonnegative().optional(),
  totalLineaCompra: z.number().int().nonnegative().optional(),
});

const previewSchema = z.object({
  lineas: z.array(lineaSchema).min(1).optional(),
  envioTotalCompra: z.number().int().nonnegative().optional(),
  valorGeneralCompra: z.number().int().nonnegative().optional(),
});

// Simula el impacto de eliminar (sin "lineas") o editar (con "lineas") una
// compra, sin escribir nada. Se usa para mostrarle al usuario qué productos
// cambiarían de costo antes de que confirme.
export async function POST(
  req: NextRequest,
  { params }: { params: { compraId: string } }
) {
  const body = await req.json().catch(() => ({}));
  const parsed = previewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const resultado = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (data.lineas) {
      const { movimientosViejos, impactos } = await calcularImpactosEditarCompra(tx, params.compraId, {
        lineas: data.lineas,
        envioTotalCompra: data.envioTotalCompra,
        valorGeneralCompra: data.valorGeneralCompra,
      });
      if (movimientosViejos.length === 0) return null;
      return impactos.filter((i) => i.costoNuevo !== i.costoAnterior);
    }

    const { movimientos, impactos } = await calcularImpactosEliminarCompra(tx, params.compraId);
    if (movimientos.length === 0) return null;
    return impactos.filter((i) => i.costoNuevo !== i.costoAnterior);
  });

  if (resultado === null) {
    return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ impactos: resultado });
}
