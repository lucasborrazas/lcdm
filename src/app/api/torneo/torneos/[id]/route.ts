import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  estado: z.enum(["PLANIFICADO", "EN_CURSO", "FINALIZADO"]).optional(),
  precioEfectivo: z.number().int().nonnegative().optional(),
  precioTransferencia: z.number().int().nonnegative().optional(),
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

  const torneo = await prisma.torneo.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json(torneo);
}
