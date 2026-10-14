import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { leerConfiguracion } from "@/lib/configuracion";
import { seccionesActivas } from "@/lib/secciones";

const schema = z.object({
  secciones: z.object({ ind: z.boolean(), tor: z.boolean(), pre: z.boolean() }).optional(),
  precios: z
    .object({
      torneoEfectivo: z.number().int().nonnegative(),
      torneoTransferencia: z.number().int().nonnegative(),
      bonoTransferencia: z.number().int().nonnegative(),
      bonoDescuentoEfectivoPct: z.number().int().min(0).max(100),
    })
    .optional(),
});

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(await leerConfiguracion());
}

// Cada parte (secciones, precios) es opcional: se guarda solo lo que viene.
export async function PUT(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { secciones, precios } = parsed.data;
  if (secciones && seccionesActivas(secciones).length === 0) {
    return NextResponse.json({ error: "Tiene que quedar al menos una sección activa" }, { status: 400 });
  }

  const data = {
    ...(secciones
      ? { indumentariaActiva: secciones.ind, torneoActivo: secciones.tor, premiosActivo: secciones.pre }
      : {}),
    ...(precios
      ? {
          precioTorneoEfectivo: precios.torneoEfectivo,
          precioTorneoTransferencia: precios.torneoTransferencia,
          bonoPrecioTransferencia: precios.bonoTransferencia,
          bonoDescuentoEfectivoPct: precios.bonoDescuentoEfectivoPct,
        }
      : {}),
  };
  await prisma.configuracion.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data },
    update: data,
  });
  return NextResponse.json(await leerConfiguracion());
}
