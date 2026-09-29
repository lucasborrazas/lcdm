import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import {
  fechaAPeriodo,
  calcularPrecioUnitario,
  calcularCostoTotal,
  calcularPrecioTotal,
  calcularGanancia,
  calcularSaldoRestante,
} from "@/lib/calculations";

const pedidoSchema = z.object({
  fecha: z.string(),
  cliente: z.string().min(1),
  productoId: z.string(),
  cantidad: z.number().int().positive(),
  metodoPago: z.enum(["EFECTIVO", "TRANSFERENCIA"]),
  precioUnitario: z.number().int().nonnegative().optional(),
  sena: z.number().int().nonnegative().default(0),
  estadoPedido: z.enum(["POR_PEDIR", "ENCARGADO", "ENTREGADO"]).default("POR_PEDIR"),
  estadoPago: z.enum(["PENDIENTE", "SENA", "PAGO"]).default("PENDIENTE"),
});

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const periodo = searchParams.get("periodo");
  const estadoPedido = searchParams.get("estadoPedido");
  const estadoPago = searchParams.get("estadoPago");
  const temporada = searchParams.get("temporada");
  const genero = searchParams.get("genero");

  const pedidos = await prisma.pedido.findMany({
    where: {
      ...(periodo ? { periodo } : {}),
      ...(estadoPedido ? { estadoPedido: estadoPedido as any } : {}),
      ...(estadoPago ? { estadoPago: estadoPago as any } : {}),
      ...(temporada ? { temporada: temporada as any } : {}),
      ...(genero ? { genero: genero as any } : {}),
    },
    include: { producto: true },
    orderBy: { fecha: "desc" },
  });

  return NextResponse.json(pedidos);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = pedidoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const producto = await prisma.producto.findUnique({ where: { id: data.productoId } });
  if (!producto) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  const fecha = new Date(data.fecha);
  const periodo = fechaAPeriodo(fecha);
  const precioUnitario =
    data.precioUnitario ?? calcularPrecioUnitario(producto.precioVenta, data.metodoPago);
  const costoUnitario = producto.costoActual ?? 0;
  const costoTotal = calcularCostoTotal(data.cantidad, costoUnitario);
  const precioTotal = calcularPrecioTotal(data.cantidad, precioUnitario);
  const ganancia = calcularGanancia(precioTotal, costoTotal);
  const saldoRestante = calcularSaldoRestante(precioTotal, data.sena);

  const pedido = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const p = await tx.pedido.create({
      data: {
        fecha,
        periodo,
        cliente: data.cliente,
        productoId: data.productoId,
        temporada: producto.temporada,
        genero: producto.genero,
        productoNombre: producto.nombre,
        talle: producto.talle,
        cantidad: data.cantidad,
        costoUnitario,
        costoTotal,
        metodoPago: data.metodoPago,
        precioUnitario,
        precioTotal,
        ganancia,
        sena: data.sena,
        saldoRestante,
        estadoPedido: data.estadoPedido,
        estadoPago: data.estadoPago,
        stockDescontado: false,
      },
    });

    if (data.estadoPedido === "ENTREGADO") {
      await tx.pedido.update({
        where: { id: p.id },
        data: { stockDescontado: true },
      });
    }

    return p;
  });

  return NextResponse.json(pedido, { status: 201 });
}
