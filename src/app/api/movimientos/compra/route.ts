import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { fechaAPeriodo, calcularLineasCompra } from "@/lib/calculations";
import { crearLineasDeCompra } from "@/lib/compraStock";

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
  valorGeneralCompra: z.number().int().nonnegative().optional(),
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

  const lineasCalculadas = calcularLineasCompra(data.lineas, data.envioTotalCompra, data.valorGeneralCompra);

  const movimientos = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    return crearLineasDeCompra(tx, {
      fecha,
      periodo,
      motivo: data.motivo,
      notas: data.notas,
      compraId,
      envioTotalCompra: data.envioTotalCompra ?? null,
      lineasCalculadas,
      productoPorId,
    });
  });

  return NextResponse.json({ compraId, movimientos }, { status: 201 });
}
