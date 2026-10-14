import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { leerConfigSecciones } from "@/lib/configuracion";
import { seccionesActivas } from "@/lib/secciones";

const schema = z.object({
  secciones: z.object({ ind: z.boolean(), tor: z.boolean() }),
});

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({ secciones: await leerConfigSecciones() });
}

export async function PUT(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { secciones } = parsed.data;
  if (seccionesActivas(secciones).length === 0) {
    return NextResponse.json({ error: "Tiene que quedar al menos una sección activa" }, { status: 400 });
  }

  const data = { indumentariaActiva: secciones.ind, torneoActivo: secciones.tor };
  await prisma.configuracion.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data },
    update: data,
  });
  return NextResponse.json({ secciones: await leerConfigSecciones() });
}
