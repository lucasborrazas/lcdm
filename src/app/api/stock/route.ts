import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET() {
  const productos = await prisma.producto.findMany({
    include: {
      stock: true,
      movimientos: { where: { stockProcesado: true } },
      pedidos: { where: { stockDescontado: true } },
    },
    orderBy: [
      { temporada: "asc" },
      { genero: "asc" },
      { nombre: "asc" },
      { talle: "asc" },
    ],
  });

  const result = productos.map((p) => {
    const ingresos = p.movimientos
      .filter((m) => m.tipo === "INGRESO")
      .reduce((s: number, m) => s + m.cantidad, 0);
    const egresosMovimientos = p.movimientos
      .filter((m) => m.tipo === "EGRESO")
      .reduce((s: number, m) => s + m.cantidad, 0);
    const egresosPedidos = p.pedidos.reduce((s: number, pd) => s + pd.cantidad, 0);
    const stockInicial = p.stock?.stockInicial ?? 0;
    const stockActual = stockInicial + ingresos - egresosMovimientos - egresosPedidos;
    const alertaMinimo = p.stock?.alertaMinimo ?? null;

    return {
      productoId: p.id,
      temporada: p.temporada,
      genero: p.genero,
      nombre: p.nombre,
      talle: p.talle,
      archivado: p.archivado,
      stockInicial,
      ingresos,
      egresos: egresosMovimientos + egresosPedidos,
      stockActual,
      alertaMinimo,
      stockBajo: alertaMinimo != null && alertaMinimo > 0 && stockActual < alertaMinimo,
    };
  });

  return NextResponse.json(result);
}
