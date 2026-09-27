import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { calcularGananciaUnitaria } from "@/lib/calculations";

const productoSchema = z.object({
  temporada: z.enum(["VERANO", "INVIERNO"]),
  genero: z.enum(["MASCULINO", "FEMENINO"]),
  nombre: z.string().min(1),
  talle: z.string().min(1),
  costoActual: z.number().int().nonnegative().nullable().optional(),
  precioVenta: z.number().int().nonnegative(),
  stockMinimo: z.number().int().nonnegative().nullable().optional(),
});

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

    return {
      ...p,
      stockActual,
      gananciaUnitaria:
        p.costoActual != null
          ? calcularGananciaUnitaria(p.precioVenta, p.costoActual)
          : null,
      movimientos: undefined,
      pedidos: undefined,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = productoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const producto = await prisma.producto.create({
    data: {
      ...data,
      stock: { create: { stockInicial: 0, alertaMinimo: 0 } },
    },
  });

  return NextResponse.json(producto, { status: 201 });
}
