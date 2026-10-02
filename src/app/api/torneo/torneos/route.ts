import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const torneoSchema = z.object({
  mes: z.number().int().min(1).max(12),
  anio: z.number().int().min(2000),
  duplicarDesdeTorneoId: z.string().min(1).optional(),
});

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET() {
  const torneos = await prisma.torneo.findMany({
    include: {
      horarios: {
        include: { inscripciones: { select: { pago: true, metodoPago: true } } },
      },
      gastos: { select: { monto: true } },
    },
    orderBy: [{ anio: "desc" }, { mes: "desc" }],
  });

  const result = torneos.map((t) => {
    const inscripciones = t.horarios.flatMap((h) => h.inscripciones);
    const recaudado = inscripciones.reduce((sum, i) => {
      if (!i.pago) return sum;
      const precio = i.metodoPago === "EFECTIVO" ? t.precioEfectivo : i.metodoPago === "TRANSFERENCIA" ? t.precioTransferencia : 0;
      return sum + precio;
    }, 0);
    const totalGastos = t.gastos.reduce((sum, g) => sum + g.monto, 0);
    return {
      id: t.id,
      mes: t.mes,
      anio: t.anio,
      estado: t.estado,
      precioEfectivo: t.precioEfectivo,
      precioTransferencia: t.precioTransferencia,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      cantidadHorarios: t.horarios.length,
      cantidadInscriptos: inscripciones.length,
      recaudado,
      totalGastos,
      ganancia: recaudado - totalGastos,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = torneoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const existente = await prisma.torneo.findUnique({
    where: { mes_anio: { mes: data.mes, anio: data.anio } },
  });
  if (existente) {
    return NextResponse.json({ error: "Ya existe un torneo para ese mes/año" }, { status: 409 });
  }

  const torneo = await prisma.torneo.create({
    data: { mes: data.mes, anio: data.anio },
  });

  if (data.duplicarDesdeTorneoId) {
    const horariosOrigen = await prisma.horario.findMany({
      where: { torneoId: data.duplicarDesdeTorneoId },
    });

    if (horariosOrigen.length > 0) {
      await prisma.horario.createMany({
        data: horariosOrigen.map((h) => ({
          torneoId: torneo.id,
          grupoEdadId: h.grupoEdadId,
          hora: h.hora,
          cupoMaximo: h.cupoMaximo,
          orden: h.orden,
          activo: h.activo,
        })),
      });
    }
  }

  return NextResponse.json(torneo, { status: 201 });
}
