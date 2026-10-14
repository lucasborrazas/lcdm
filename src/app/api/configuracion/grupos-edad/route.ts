import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ nombre: z.string().trim().min(1) });

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET() {
  const grupos = await prisma.grupoEdad.findMany({
    include: { _count: { select: { horarios: true, turnosEntrega: true, plantillaHorarios: true } } },
    orderBy: { nombre: "asc" },
  });
  return NextResponse.json(
    grupos.map(({ _count, ...g }) => ({ ...g, enUso: _count.horarios + _count.turnosEntrega + _count.plantillaHorarios }))
  );
}

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const existente = await prisma.grupoEdad.findUnique({ where: { nombre: parsed.data.nombre } });
  if (existente) {
    return NextResponse.json({ error: "Ya existe un grupo con ese nombre" }, { status: 409 });
  }
  const grupo = await prisma.grupoEdad.create({ data: parsed.data });
  return NextResponse.json(grupo, { status: 201 });
}
