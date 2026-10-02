import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const gastoSchema = z.object({
  torneoId: z.string().min(1),
  concepto: z.string().min(1),
  monto: z.number().int().nonnegative(),
});

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const torneoId = req.nextUrl.searchParams.get("torneoId");
  if (!torneoId) {
    return NextResponse.json({ error: "Falta torneoId" }, { status: 400 });
  }

  const gastos = await prisma.gastoTorneo.findMany({
    where: { torneoId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(gastos);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = gastoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const torneo = await prisma.torneo.findUnique({ where: { id: data.torneoId } });
  if (!torneo) {
    return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });
  }

  const gasto = await prisma.gastoTorneo.create({ data });

  return NextResponse.json(gasto, { status: 201 });
}
