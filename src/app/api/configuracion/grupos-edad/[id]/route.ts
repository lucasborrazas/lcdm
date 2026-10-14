import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ nombre: z.string().trim().min(1) });

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const otro = await prisma.grupoEdad.findUnique({ where: { nombre: parsed.data.nombre } });
  if (otro && otro.id !== params.id) {
    return NextResponse.json({ error: "Ya existe un grupo con ese nombre" }, { status: 409 });
  }
  // Renombrar actualiza todos los horarios y turnos que lo usan (se vinculan por id).
  const grupo = await prisma.grupoEdad.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(grupo);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const [horarios, turnos, plantillas] = await Promise.all([
    prisma.horario.count({ where: { grupoEdadId: params.id } }),
    prisma.turnoEntrega.count({ where: { grupoEdadId: params.id } }),
    prisma.plantillaHorario.count({ where: { grupoEdadId: params.id } }),
  ]);
  const enUso = horarios + turnos + plantillas;
  if (enUso > 0) {
    return NextResponse.json(
      { error: `No se puede eliminar: lo usan ${enUso} horario(s) o turno(s).` },
      { status: 409 }
    );
  }
  await prisma.grupoEdad.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
