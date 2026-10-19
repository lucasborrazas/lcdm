import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leerSimulacion, simulacionSchema } from "@/lib/simulacionTorneo";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const torneoId = req.nextUrl.searchParams.get("torneoId");
  if (!torneoId) {
    return NextResponse.json({ error: "Falta torneoId" }, { status: 400 });
  }
  const fila = await prisma.simulacionTorneo.findUnique({ where: { torneoId } });
  return NextResponse.json(leerSimulacion(fila?.datos));
}

export async function PUT(req: NextRequest) {
  const torneoId = req.nextUrl.searchParams.get("torneoId");
  if (!torneoId) {
    return NextResponse.json({ error: "Falta torneoId" }, { status: 400 });
  }
  const parsed = simulacionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const torneo = await prisma.torneo.findUnique({ where: { id: torneoId } });
  if (!torneo) {
    return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });
  }

  const datos = JSON.stringify(parsed.data);
  await prisma.simulacionTorneo.upsert({
    where: { torneoId },
    create: { torneoId, datos },
    update: { datos },
  });
  return NextResponse.json(parsed.data);
}
