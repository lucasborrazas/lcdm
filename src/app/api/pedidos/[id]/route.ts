import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import {
  calcularPrecioUnitario,
  calcularCostoTotal,
  calcularPrecioTotal,
  calcularGanancia,
  calcularSaldoRestante,
} from "@/lib/calculations";

const updateSchema = z.object({
  cliente: z.string().min(1).optional(),
  metodoPago: z.enum(["EFECTIVO", "TRANSFERENCIA"]).optional(),
  cantidad: z.number().int().positive().optional(),
  precioUnitario: z.number().int().nonnegative().optional(),
  sena: z.number().int().nonnegative().optional(),
  estadoPedido: z.enum(["POR_PEDIR", "ENCARGADO", "ENTREGADO"]).optional(),
  estadoPago: z.enum(["PENDIENTE", "SENA", "PAGO"]).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const pedido = await prisma.pedido.findUnique({
    where: { id: params.id },
    include: { producto: true },
  });
  if (!pedido) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(pedido);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const pedidoActual = await prisma.pedido.findUnique({
    where: { id: params.id },
    include: { producto: true },
  });
  if (!pedidoActual) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const metodoPago = data.metodoPago ?? pedidoActual.metodoPago;
  const cantidad = data.cantidad ?? pedidoActual.cantidad;
  const sena = data.sena ?? pedidoActual.sena;

  const precioUnitario =
    data.precioUnitario ?? calcularPrecioUnitario(pedidoActual.producto.precioVenta, metodoPago);
  const costoUnitario = pedidoActual.producto.costoActual ?? 0;
  const costoTotal = calcularCostoTotal(cantidad, costoUnitario);
  const precioTotal = calcularPrecioTotal(cantidad, precioUnitario);
  const ganancia = calcularGanancia(precioTotal, costoTotal);
  const saldoRestante = calcularSaldoRestante(precioTotal, sena);

  const pedido = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const p = await tx.pedido.update({
      where: { id: params.id },
      data: {
        ...data,
        precioUnitario,
        costoUnitario,
        costoTotal,
        precioTotal,
        ganancia,
        saldoRestante,
      },
    });

    const pasaAEntregado =
      data.estadoPedido === "ENTREGADO" && !pedidoActual.stockDescontado;

    if (pasaAEntregado) {
      await tx.pedido.update({
        where: { id: params.id },
        data: { stockDescontado: true },
      });
    }

    return p;
  });

  return NextResponse.json(pedido);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const pedido = await prisma.pedido.findUnique({ where: { id: params.id } });
  if (!pedido) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.pedidoEliminado.create({
      data: {
        pedidoIdOriginal: pedido.id,
        fecha: pedido.fecha,
        periodo: pedido.periodo,
        cliente: pedido.cliente,
        temporada: pedido.temporada,
        genero: pedido.genero,
        productoNombre: pedido.productoNombre,
        talle: pedido.talle,
        cantidad: pedido.cantidad,
        costoUnitario: pedido.costoUnitario,
        costoTotal: pedido.costoTotal,
        metodoPago: pedido.metodoPago,
        precioUnitario: pedido.precioUnitario,
        precioTotal: pedido.precioTotal,
        ganancia: pedido.ganancia,
        sena: pedido.sena,
        saldoRestante: pedido.saldoRestante,
        estadoPedido: pedido.estadoPedido,
        estadoPago: pedido.estadoPago,
        stockDescontado: pedido.stockDescontado,
      },
    }),
    prisma.pedido.delete({ where: { id: params.id } }),
  ]);

  return new NextResponse(null, { status: 204 });
}
