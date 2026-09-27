import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { calcularGananciaUnitaria } from "@/lib/calculations";

const updateSchema = z.object({
  costoActual: z.number().int().nonnegative().nullable().optional(),
  precioVenta: z.number().int().nonnegative().optional(),
  stockMinimo: z.number().int().nonnegative().nullable().optional(),
  archivado: z.boolean().optional(),
  motivo: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const producto = await prisma.producto.findUnique({
    where: { id: params.id },
    include: { stock: true },
  });
  if (!producto) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    ...producto,
    gananciaUnitaria:
      producto.costoActual != null
        ? calcularGananciaUnitaria(producto.precioVenta, producto.costoActual)
        : null,
  });
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

  const { motivo, ...updateData } = parsed.data;

  const productoActual = await prisma.producto.findUnique({
    where: { id: params.id },
  });
  if (!productoActual) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const cambiaCosto =
    updateData.costoActual !== undefined &&
    updateData.costoActual !== productoActual.costoActual;
  const cambiaPrecio =
    updateData.precioVenta !== undefined &&
    updateData.precioVenta !== productoActual.precioVenta;

  const producto = await prisma.producto.update({
    where: { id: params.id },
    data: updateData,
  });

  if (cambiaCosto || cambiaPrecio) {
    let motivoHistorial = "Cambio manual de costo y precio";
    if (cambiaCosto && !cambiaPrecio) motivoHistorial = "Cambio manual de costo";
    if (!cambiaCosto && cambiaPrecio) motivoHistorial = "Cambio manual de precio";
    if (motivo) motivoHistorial = motivo;

    await prisma.historialPrecios.create({
      data: {
        productoId: producto.id,
        temporada: producto.temporada,
        genero: producto.genero,
        productoNombre: producto.nombre,
        talle: producto.talle,
        costoAnterior: productoActual.costoActual ?? 0,
        costoNuevo: producto.costoActual ?? 0,
        precioAnterior: productoActual.precioVenta,
        precioNuevo: producto.precioVenta,
        motivo: motivoHistorial,
      },
    });
  }

  return NextResponse.json(producto);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.producto.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
