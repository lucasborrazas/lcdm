import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  precioTransferencia: z.number().int().nonnegative().optional(),
  precioEfectivo: z.number().int().nonnegative().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Las familias ya cargadas conservan su monto: cambiar el precio general no las toca.
  const entrega = await prisma.entregaPremios.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json(entrega);
}
