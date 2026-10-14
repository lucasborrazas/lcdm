import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const turnoSchema = z.object({
  entregaId: z.string().min(1),
  hora: z.string().trim().min(1),
  grupoEdadNombre: z.string().trim().nullable().optional(),
});

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const entregaId = req.nextUrl.searchParams.get("entregaId");
  if (!entregaId) {
    return NextResponse.json({ error: "Falta entregaId" }, { status: 400 });
  }

  const turnos = await prisma.turnoEntrega.findMany({
    where: { entregaId },
    include: { grupoEdad: true, _count: { select: { familias: true } } },
    orderBy: { hora: "asc" },
  });

  return NextResponse.json(
    turnos.map(({ _count, ...t }) => ({ ...t, cantidadFamilias: _count.familias }))
  );
}

export async function POST(req: NextRequest) {
  const parsed = turnoSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { entregaId, hora, grupoEdadNombre } = parsed.data;

  const entrega = await prisma.entregaPremios.findUnique({ where: { id: entregaId } });
  if (!entrega) {
    return NextResponse.json({ error: "Entrega no encontrada" }, { status: 404 });
  }

  const turno = await prisma.turnoEntrega.create({
    data: {
      entrega: { connect: { id: entregaId } },
      hora,
      ...(grupoEdadNombre
        ? { grupoEdad: { connectOrCreate: { where: { nombre: grupoEdadNombre }, create: { nombre: grupoEdadNombre } } } }
        : {}),
    },
    include: { grupoEdad: true },
  });

  return NextResponse.json(turno, { status: 201 });
}
