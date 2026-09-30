import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  cliente: z.string().min(1).optional(),
  sena: z.number().int().nonnegative().optional(),
  estadoPago: z.enum(["PENDIENTE", "SENA", "PAGO"]).optional(),
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
  const data = parsed.data;

  const grupoActual = await prisma.pedidoGrupo.findUnique({ where: { id: params.id } });
  if (!grupoActual) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sena = data.sena ?? grupoActual.sena;
  const saldoRestante = grupoActual.precioTotal - sena;

  const grupo = await prisma.pedidoGrupo.update({
    where: { id: params.id },
    data: {
      ...data,
      saldoRestante,
    },
  });

  return NextResponse.json(grupo);
}
