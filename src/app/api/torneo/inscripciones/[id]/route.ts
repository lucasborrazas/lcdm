import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  nombre: z.string().min(1).optional(),
  edad: z.string().min(1).optional(),
  horarioId: z.string().min(1).optional(),
  pago: z.boolean().optional(),
  metodoPago: z.enum(["EFECTIVO", "TRANSFERENCIA"]).nullable().optional(),
  equipo: z.enum(["ROJO", "AMARILLO", "NARANJA"]).nullable().optional(),
  equipoAsignadoAt: z.string().nullable().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { equipo, equipoAsignadoAt, ...resto } = parsed.data;

  const inscripcion = await prisma.inscripcionTorneo.update({
    where: { id: params.id },
    data: {
      ...resto,
      ...("equipo" in parsed.data
        ? {
            equipo,
            equipoAsignadoAt: "equipoAsignadoAt" in parsed.data
              ? (equipoAsignadoAt ? new Date(equipoAsignadoAt) : null)
              : (equipo ? new Date() : null),
          }
        : {}),
      // cambiar de horario deja de tener sentido el equipo asignado en el horario anterior
      ...("horarioId" in parsed.data ? { equipo: null, equipoAsignadoAt: null } : {}),
    },
    include: { horario: { include: { grupoEdad: true } } },
  });

  return NextResponse.json(inscripcion);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.inscripcionTorneo.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
