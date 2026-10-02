import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  hora: z.string().min(1).optional(),
  grupoEdadNombre: z.string().min(1).optional(),
  cupoMaximo: z.number().int().positive().nullable().optional(),
  orden: z.number().int().optional(),
  activo: z.boolean().optional(),
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
  const { grupoEdadNombre, ...rest } = parsed.data;

  const horario = await prisma.horario.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(grupoEdadNombre
        ? {
            grupoEdad: {
              connectOrCreate: {
                where: { nombre: grupoEdadNombre.trim() },
                create: { nombre: grupoEdadNombre.trim() },
              },
            },
          }
        : {}),
    },
    include: { grupoEdad: true },
  });

  return NextResponse.json(horario);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const inscriptos = await prisma.inscripcionTorneo.count({ where: { horarioId: params.id } });
  if (inscriptos > 0) {
    return NextResponse.json(
      { error: `No se puede eliminar: tiene ${inscriptos} inscripto(s). Desactivalo en vez de borrarlo.` },
      { status: 409 }
    );
  }

  await prisma.horario.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
