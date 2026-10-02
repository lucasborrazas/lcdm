import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const horarioSchema = z.object({
  torneoId: z.string().min(1),
  hora: z.string().min(1),
  grupoEdadNombre: z.string().min(1),
  cupoMaximo: z.number().int().positive().nullable().optional(),
  orden: z.number().int().optional(),
});

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const torneoId = req.nextUrl.searchParams.get("torneoId");
  if (!torneoId) {
    return NextResponse.json({ error: "Falta torneoId" }, { status: 400 });
  }

  const horarios = await prisma.horario.findMany({
    where: { torneoId },
    include: { grupoEdad: true, _count: { select: { inscripciones: true } } },
    orderBy: { orden: "asc" },
  });

  const result = horarios.map((h) => ({
    id: h.id,
    torneoId: h.torneoId,
    grupoEdadId: h.grupoEdadId,
    grupoEdad: h.grupoEdad,
    hora: h.hora,
    cupoMaximo: h.cupoMaximo,
    orden: h.orden,
    activo: h.activo,
    inscriptos: h._count.inscripciones,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = horarioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const torneo = await prisma.torneo.findUnique({ where: { id: data.torneoId } });
  if (!torneo) {
    return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });
  }

  const maxOrden = await prisma.horario.aggregate({
    where: { torneoId: data.torneoId },
    _max: { orden: true },
  });
  const orden = data.orden ?? (maxOrden._max.orden ?? -1) + 1;

  const horario = await prisma.horario.create({
    data: {
      torneo: { connect: { id: data.torneoId } },
      hora: data.hora,
      cupoMaximo: data.cupoMaximo ?? null,
      orden,
      grupoEdad: {
        connectOrCreate: {
          where: { nombre: data.grupoEdadNombre.trim() },
          create: { nombre: data.grupoEdadNombre.trim() },
        },
      },
    },
    include: { grupoEdad: true },
  });

  return NextResponse.json(horario, { status: 201 });
}
