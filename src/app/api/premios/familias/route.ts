import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { familiaSchema } from "./schema";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const incluir = { chicos: { orderBy: { createdAt: "asc" as const } }, turno: { include: { grupoEdad: true } } };

export async function GET(req: NextRequest) {
  const entregaId = req.nextUrl.searchParams.get("entregaId");
  if (!entregaId) {
    return NextResponse.json({ error: "Falta entregaId" }, { status: 400 });
  }

  const familias = await prisma.familiaEntrega.findMany({
    where: { turno: { entregaId } },
    include: incluir,
    orderBy: [{ turno: { hora: "asc" } }, { nombre: "asc" }],
  });

  return NextResponse.json(familias);
}

export async function POST(req: NextRequest) {
  const parsed = familiaSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { chicos, ...data } = parsed.data;

  const turno = await prisma.turnoEntrega.findUnique({ where: { id: data.turnoId } });
  if (!turno) {
    return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
  }

  const familia = await prisma.familiaEntrega.create({
    data: { ...data, metodoPago: data.metodoPago ?? null, chicos: { create: chicos } },
    include: incluir,
  });

  return NextResponse.json(familia, { status: 201 });
}
