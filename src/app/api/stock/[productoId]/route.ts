import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  stockInicial: z.number().int().min(0),
  alertaMinimo: z.number().int().min(0).nullable().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { productoId: string } }
) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const stock = await prisma.stock.upsert({
    where: { productoId: params.productoId },
    update: {
      stockInicial: parsed.data.stockInicial,
      ...(parsed.data.alertaMinimo !== undefined
        ? { alertaMinimo: parsed.data.alertaMinimo }
        : {}),
    },
    create: {
      productoId: params.productoId,
      stockInicial: parsed.data.stockInicial,
      alertaMinimo: parsed.data.alertaMinimo ?? 0,
    },
  });

  return NextResponse.json(stock);
}
