import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  concepto: z.string().trim().min(1).optional(),
  monto: z.number().int().nonnegative().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const gasto = await prisma.gastoEntrega.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(gasto);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.gastoEntrega.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
