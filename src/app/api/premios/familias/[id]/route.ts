import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { familiaSchema } from "../schema";

const incluir = { chicos: { orderBy: { createdAt: "asc" as const } }, turno: { include: { grupoEdad: true } } };

// Cambios parciales (cobro rapido, cambio de turno)...
const parcialSchema = z.object({
  turnoId: z.string().min(1).optional(),
  metodoPago: z.enum(["EFECTIVO", "TRANSFERENCIA"]).nullable().optional(),
  monto: z.number().int().nonnegative().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = parcialSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const familia = await prisma.familiaEntrega.update({
    where: { id: params.id },
    data: parsed.data,
    include: incluir,
  });
  return NextResponse.json(familia);
}

// ...y edicion completa: los chicos se reemplazan por la lista enviada.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = familiaSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { chicos, ...data } = parsed.data;

  const [, familia] = await prisma.$transaction([
    prisma.chicoEntrega.deleteMany({ where: { familiaId: params.id } }),
    prisma.familiaEntrega.update({
      where: { id: params.id },
      data: { ...data, telefono: data.telefono || null, metodoPago: data.metodoPago ?? null, chicos: { create: chicos } },
      include: incluir,
    }),
  ]);

  return NextResponse.json(familia);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.familiaEntrega.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
