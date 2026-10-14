import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const gastoSchema = z.object({
  entregaId: z.string().min(1),
  concepto: z.string().trim().min(1),
  monto: z.number().int().nonnegative(),
});

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const entregaId = req.nextUrl.searchParams.get("entregaId");
  if (!entregaId) {
    return NextResponse.json({ error: "Falta entregaId" }, { status: 400 });
  }

  const gastos = await prisma.gastoEntrega.findMany({
    where: { entregaId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(gastos);
}

export async function POST(req: NextRequest) {
  const parsed = gastoSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const entrega = await prisma.entregaPremios.findUnique({ where: { id: parsed.data.entregaId } });
  if (!entrega) {
    return NextResponse.json({ error: "Entrega no encontrada" }, { status: 404 });
  }

  const gasto = await prisma.gastoEntrega.create({ data: parsed.data });
  return NextResponse.json(gasto, { status: 201 });
}
