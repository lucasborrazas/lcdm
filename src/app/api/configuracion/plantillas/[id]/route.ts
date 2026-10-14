import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  hora: z.string().trim().min(1).optional(),
  // vacio o null = sin grupo etario
  grupoEdadNombre: z.string().trim().nullable().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { hora, grupoEdadNombre } = parsed.data;

  const actual = await prisma.plantillaHorario.findUnique({ where: { id: params.id } });
  if (!actual) {
    return NextResponse.json({ error: "Horario no encontrado" }, { status: 404 });
  }
  if (actual.seccion === "TORNEO" && grupoEdadNombre !== undefined && !grupoEdadNombre) {
    return NextResponse.json({ error: "El grupo de edad es obligatorio en los horarios de torneo" }, { status: 400 });
  }

  const plantilla = await prisma.plantillaHorario.update({
    where: { id: params.id },
    data: {
      ...(hora ? { hora } : {}),
      ...(grupoEdadNombre === undefined
        ? {}
        : grupoEdadNombre
          ? { grupoEdad: { connectOrCreate: { where: { nombre: grupoEdadNombre }, create: { nombre: grupoEdadNombre } } } }
          : { grupoEdad: { disconnect: true } }),
    },
    include: { grupoEdad: true },
  });
  return NextResponse.json(plantilla);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.plantillaHorario.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
