import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import {
  calcularPrecioUnitario,
  calcularCostoTotal,
  calcularPrecioTotal,
  calcularGanancia,
} from "@/lib/calculations";
import { descuentaStock } from "@/lib/stock";
import { recalcularGrupo } from "@/lib/pedidoGrupo";

const lineaSchema = z.object({
  productoId: z.string().min(1),
  cantidad: z.number().int().positive(),
  precioUnitario: z.number().int().nonnegative().optional(),
  estadoPedido: z.enum(["POR_PEDIR", "ENCARGADO", "ENTREGADO"]).default("POR_PEDIR"),
});

// Agrega un producto a un pedido existente. La linea hereda fecha, cliente,
// medio y estado de pago del pedido; la seña sigue siendo del pedido entero.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const parsed = lineaSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const [grupo, producto] = await Promise.all([
    prisma.pedidoGrupo.findUnique({ where: { id: params.id } }),
    prisma.producto.findUnique({ where: { id: data.productoId } }),
  ]);
  if (!grupo) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  if (!producto) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

  const precioUnitario = data.precioUnitario ?? calcularPrecioUnitario(producto.precioVenta, grupo.metodoPago);
  const costoUnitario = producto.costoActual ?? 0;
  const costoTotal = calcularCostoTotal(data.cantidad, costoUnitario);
  const precioTotal = calcularPrecioTotal(data.cantidad, precioUnitario);

  const linea = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const p = await tx.pedido.create({
      data: {
        fecha: grupo.fecha,
        periodo: grupo.periodo,
        cliente: grupo.cliente,
        productoId: producto.id,
        temporada: producto.temporada,
        genero: producto.genero,
        productoNombre: producto.nombre,
        talle: producto.talle,
        cantidad: data.cantidad,
        costoUnitario,
        costoTotal,
        metodoPago: grupo.metodoPago,
        precioUnitario,
        precioTotal,
        ganancia: calcularGanancia(precioTotal, costoTotal),
        sena: 0,
        saldoRestante: precioTotal,
        estadoPedido: data.estadoPedido,
        estadoPago: grupo.estadoPago,
        stockDescontado: descuentaStock(data.estadoPedido),
        pedidoGrupoId: grupo.id,
      },
    });
    await recalcularGrupo(tx, grupo.id);
    return p;
  });

  return NextResponse.json(linea, { status: 201 });
}
