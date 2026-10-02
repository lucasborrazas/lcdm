import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  concepto: z.string().min(1).optional(),
  monto: z.number().int().nonnegative().optional(),
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

  const gasto = await prisma.gastoTorneo.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json(gasto);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.gastoTorneo.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
