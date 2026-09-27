import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productoId = searchParams.get("productoId");
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");
  const motivo = searchParams.get("motivo");

  const historial = await prisma.historialPrecios.findMany({
    where: {
      ...(productoId ? { productoId } : {}),
      ...(motivo ? { motivo: { contains: motivo } } : {}),
      ...(desde || hasta
        ? {
            fecha: {
              ...(desde ? { gte: new Date(desde) } : {}),
              ...(hasta ? { lte: new Date(hasta) } : {}),
            },
          }
        : {}),
    },
    include: { producto: true },
    orderBy: { fecha: "desc" },
  });

  return NextResponse.json(historial);
}
