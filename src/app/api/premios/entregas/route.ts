import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { BONO_POR_DEFECTO, TURNOS_POR_DEFECTO, precioEfectivoDesde, totalesEntrega } from "@/lib/premios";

const entregaSchema = z.object({
  anio: z.number().int().min(2000),
  duplicarDesdeEntregaId: z.string().min(1).optional(),
});

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET() {
  const entregas = await prisma.entregaPremios.findMany({
    include: {
      turnos: { include: { familias: { include: { chicos: { select: { genero: true } } } } } },
      gastos: { select: { monto: true } },
    },
    orderBy: { anio: "desc" },
  });

  const result = entregas.map(({ turnos, gastos, ...e }) => {
    const familias = turnos.flatMap((t) => t.familias);
    const totales = totalesEntrega(familias, gastos);
    return {
      ...e,
      cantidadTurnos: turnos.length,
      cantidadFamilias: totales.familias,
      cantidadChicos: totales.chicos,
      masculino: totales.masculino,
      femenino: totales.femenino,
      personas: totales.personas,
      cobrado: totales.cobrado,
      pendiente: totales.pendiente,
      totalGastos: totales.gastos,
      ganancia: totales.ganancia,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const parsed = entregaSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { anio, duplicarDesdeEntregaId } = parsed.data;

  const existente = await prisma.entregaPremios.findUnique({ where: { anio } });
  if (existente) {
    return NextResponse.json({ error: "Ya existe una entrega para ese año" }, { status: 409 });
  }

  const origen = duplicarDesdeEntregaId
    ? await prisma.entregaPremios.findUnique({
        where: { id: duplicarDesdeEntregaId },
        include: { turnos: { orderBy: { hora: "asc" } } },
      })
    : null;

  const precioTransferencia = origen?.precioTransferencia ?? BONO_POR_DEFECTO.precioTransferencia;
  const entrega = await prisma.entregaPremios.create({
    data: {
      anio,
      precioTransferencia,
      precioEfectivo: origen?.precioEfectivo ?? precioEfectivoDesde(precioTransferencia),
      turnos: {
        create: origen
          ? origen.turnos.map((t) => ({ hora: t.hora, grupoEdadId: t.grupoEdadId, activo: t.activo }))
          : TURNOS_POR_DEFECTO.map((hora) => ({ hora })),
      },
    },
  });

  return NextResponse.json(entrega, { status: 201 });
}
