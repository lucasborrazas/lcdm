import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  hora: z.string().trim().min(1).optional(),
  // vacio o null = sin grupo etario
  grupoEdadNombre: z.string().trim().nullable().optional(),
  activo: z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { grupoEdadNombre, ...rest } = parsed.data;

  const turno = await prisma.turnoEntrega.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(grupoEdadNombre === undefined
        ? {}
        : grupoEdadNombre
          ? { grupoEdad: { connectOrCreate: { where: { nombre: grupoEdadNombre }, create: { nombre: grupoEdadNombre } } } }
          : { grupoEdad: { disconnect: true } }),
    },
    include: { grupoEdad: true },
  });

  return NextResponse.json(turno);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const familias = await prisma.familiaEntrega.count({ where: { turnoId: params.id } });
  if (familias > 0) {
    return NextResponse.json(
      { error: `No se puede eliminar: tiene ${familias} familia(s). Desactivalo en vez de borrarlo.` },
      { status: 409 }
    );
  }

  await prisma.turnoEntrega.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
