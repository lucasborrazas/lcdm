import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { descuentaStock } from "@/lib/stock";
import { recalcularGrupo } from "@/lib/pedidoGrupo";
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
  productoId: z.string().min(1).optional(),
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

  // Cambiar de producto o de talle es cambiar de productoId: se actualiza la
  // foto del producto en el pedido y el stock pasa solo al producto nuevo.
  const producto =
    data.productoId && data.productoId !== pedidoActual.productoId
      ? await prisma.producto.findUnique({ where: { id: data.productoId } })
      : pedidoActual.producto;
  if (!producto) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  const metodoPago = data.metodoPago ?? pedidoActual.metodoPago;
  const cantidad = data.cantidad ?? pedidoActual.cantidad;
  const sena = data.sena ?? pedidoActual.sena;

  const precioUnitario =
    data.precioUnitario ?? calcularPrecioUnitario(producto.precioVenta, metodoPago);
  const costoUnitario = producto.costoActual ?? 0;
  const costoTotal = calcularCostoTotal(cantidad, costoUnitario);
  const precioTotal = calcularPrecioTotal(cantidad, precioUnitario);
  const ganancia = calcularGanancia(precioTotal, costoTotal);
  const saldoRestante = calcularSaldoRestante(precioTotal, sena);

  const pedido = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const p = await tx.pedido.update({
      where: { id: params.id },
      data: {
        ...data,
        productoId: producto.id,
        temporada: producto.temporada,
        genero: producto.genero,
        productoNombre: producto.nombre,
        talle: producto.talle,
        stockDescontado: descuentaStock(data.estadoPedido ?? pedidoActual.estadoPedido),
        precioUnitario,
        costoUnitario,
        costoTotal,
        precioTotal,
        ganancia,
        saldoRestante,
      },
    });
    await recalcularGrupo(tx, p.pedidoGrupoId);

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

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.pedidoEliminado.create({
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
    });
    await tx.pedido.delete({ where: { id: params.id } });
    await recalcularGrupo(tx, pedido.pedidoGrupoId);
  });

  return new NextResponse(null, { status: 204 });
}
