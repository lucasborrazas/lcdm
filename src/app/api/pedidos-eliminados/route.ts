import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET() {
  const eliminados = await prisma.pedidoEliminado.findMany({
    orderBy: { eliminadoEn: "desc" },
  });
  return NextResponse.json(eliminados);
}
