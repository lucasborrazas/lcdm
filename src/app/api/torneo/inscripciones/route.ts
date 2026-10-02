import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const inscripcionSchema = z.object({
  nombre: z.string().min(1),
  edad: z.string().min(1),
  horarioId: z.string().min(1),
  pago: z.boolean().optional(),
  metodoPago: z.enum(["EFECTIVO", "TRANSFERENCIA"]).nullable().optional(),
  monto: z.number().int().nonnegative().nullable().optional(),
});

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const torneoId = req.nextUrl.searchParams.get("torneoId");
  if (!torneoId) {
    return NextResponse.json({ error: "Falta torneoId" }, { status: 400 });
  }

  const inscripciones = await prisma.inscripcionTorneo.findMany({
    where: { horario: { torneoId } },
    include: { horario: { include: { grupoEdad: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(inscripciones);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = inscripcionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const horario = await prisma.horario.findUnique({ where: { id: data.horarioId } });
  if (!horario) {
    return NextResponse.json({ error: "Horario no encontrado" }, { status: 404 });
  }

  const inscripcion = await prisma.inscripcionTorneo.create({
    data: {
      nombre: data.nombre,
      edad: data.edad,
      horarioId: data.horarioId,
      pago: data.pago ?? false,
      metodoPago: data.metodoPago ?? null,
      monto: data.monto ?? null,
    },
    include: { horario: { include: { grupoEdad: true } } },
  });

  return NextResponse.json(inscripcion, { status: 201 });
}
