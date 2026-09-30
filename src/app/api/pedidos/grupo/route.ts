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
} from "@/lib/calculations";

const lineaSchema = z.object({
  productoId: z.string(),
  cantidad: z.number().int().positive(),
  precioUnitario: z.number().int().nonnegative().optional(),
});

const grupoSchema = z.object({
  fecha: z.string(),
  cliente: z.string().min(1),
  metodoPago: z.enum(["EFECTIVO", "TRANSFERENCIA"]),
  sena: z.number().int().nonnegative().default(0),
  estadoPedido: z.enum(["POR_PEDIR", "ENCARGADO", "ENTREGADO"]).default("POR_PEDIR"),
  estadoPago: z.enum(["PENDIENTE", "SENA", "PAGO"]).default("PENDIENTE"),
  lineas: z.array(lineaSchema).min(1),
});

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

// Crea un pedido con varias lineas (varios productos) a la vez. La sena,
// el saldo y el estado de pago son del pedido completo, no de cada linea
// -- por eso viven en PedidoGrupo. El estado de entrega si queda por
// linea, porque un producto se puede entregar antes que otro.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = grupoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const productoIds = data.lineas.map((l) => l.productoId);
  const productos = await prisma.producto.findMany({ where: { id: { in: productoIds } } });
  const productoPorId = new Map(productos.map((p) => [p.id, p]));

  for (const id of productoIds) {
    if (!productoPorId.has(id)) {
      return NextResponse.json({ error: `Producto no encontrado: ${id}` }, { status: 404 });
    }
  }

  const fecha = new Date(data.fecha);
  const periodo = fechaAPeriodo(fecha);

  const lineasCalculadas = data.lineas.map((linea) => {
    const producto = productoPorId.get(linea.productoId)!;
    const precioUnitario =
      linea.precioUnitario ?? calcularPrecioUnitario(producto.precioVenta, data.metodoPago);
    const costoUnitario = producto.costoActual ?? 0;
    const costoTotal = calcularCostoTotal(linea.cantidad, costoUnitario);
    const precioTotal = calcularPrecioTotal(linea.cantidad, precioUnitario);
    const ganancia = calcularGanancia(precioTotal, costoTotal);
    return { ...linea, producto, precioUnitario, costoUnitario, costoTotal, precioTotal, ganancia };
  });

  const precioTotalGrupo = lineasCalculadas.reduce((s, l) => s + l.precioTotal, 0);
  const saldoRestanteGrupo = precioTotalGrupo - data.sena;

  const resultado = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const grupo = await tx.pedidoGrupo.create({
      data: {
        fecha,
        periodo,
        cliente: data.cliente,
        metodoPago: data.metodoPago,
        precioTotal: precioTotalGrupo,
        sena: data.sena,
        saldoRestante: saldoRestanteGrupo,
        estadoPago: data.estadoPago,
      },
    });

    const lineas = [];
    for (const linea of lineasCalculadas) {
      const p = await tx.pedido.create({
        data: {
          fecha,
          periodo,
          cliente: data.cliente,
          productoId: linea.productoId,
          temporada: linea.producto.temporada,
          genero: linea.producto.genero,
          productoNombre: linea.producto.nombre,
          talle: linea.producto.talle,
          cantidad: linea.cantidad,
          costoUnitario: linea.costoUnitario,
          costoTotal: linea.costoTotal,
          metodoPago: data.metodoPago,
          precioUnitario: linea.precioUnitario,
          precioTotal: linea.precioTotal,
          ganancia: linea.ganancia,
          sena: 0,
          saldoRestante: linea.precioTotal,
          estadoPedido: data.estadoPedido,
          estadoPago: data.estadoPago,
          stockDescontado: data.estadoPedido === "ENTREGADO",
          pedidoGrupoId: grupo.id,
        },
      });
      lineas.push(p);
    }

    return { grupo, lineas };
  });

  return NextResponse.json(resultado, { status: 201 });
}
