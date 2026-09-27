import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcularMargen, periodoActual } from "@/lib/calculations";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const periodo = searchParams.get("periodo") ?? periodoActual();
  const estadoPedido = searchParams.get("estadoPedido");
  const estadoPago = searchParams.get("estadoPago");
  const temporada = searchParams.get("temporada");
  const genero = searchParams.get("genero");
  const productoNombre = searchParams.get("producto");

  const where: any = {
    periodo,
    ...(estadoPedido ? { estadoPedido } : {}),
    ...(estadoPago ? { estadoPago } : {}),
    ...(temporada ? { temporada } : {}),
    ...(genero ? { genero } : {}),
    ...(productoNombre ? { productoNombre: { contains: productoNombre } } : {}),
  };

  const pedidos = await prisma.pedido.findMany({ where });

  const totalVendido = pedidos.reduce((s: number, p) => s + p.precioTotal, 0);
  const costoTotal = pedidos.reduce((s: number, p) => s + p.costoTotal, 0);
  const gananciaTotal = pedidos.reduce((s: number, p) => s + p.ganancia, 0);
  const totalSenas = pedidos.reduce((s: number, p) => s + p.sena, 0);
  const saldoPendiente = pedidos.reduce((s: number, p) => s + p.saldoRestante, 0);
  const unidadesVendidas = pedidos.reduce((s: number, p) => s + p.cantidad, 0);

  const metricas = {
    totalVendido,
    cantidadPedidos: pedidos.length,
    unidadesVendidas,
    costoTotal,
    gananciaTotal,
    margenPct: calcularMargen(gananciaTotal, totalVendido),
    totalSenas,
    saldoPendiente,
  };

  // Ranking de productos
  const rankingMap = new Map<string, { nombre: string; talle: string; genero: string; temporada: string; unidades: number; ventas: number; ganancia: number }>();
  for (const p of pedidos) {
    const key = `${p.productoNombre}|${p.talle}`;
    const existing = rankingMap.get(key) ?? {
      nombre: p.productoNombre,
      talle: p.talle,
      genero: p.genero,
      temporada: p.temporada,
      unidades: 0,
      ventas: 0,
      ganancia: 0,
    };
    existing.unidades += p.cantidad;
    existing.ventas += p.precioTotal;
    existing.ganancia += p.ganancia;
    rankingMap.set(key, existing);
  }
  const ranking = Array.from(rankingMap.values())
    .sort((a, b) => b.ventas - a.ventas)
    .map((r) => ({
      productoNombre: r.nombre,
      talle: r.talle,
      genero: r.genero,
      temporada: r.temporada,
      unidadesVendidas: r.unidades,
      ventas: r.ventas,
      ganancia: r.ganancia,
    }));

  // Cobranza por estado de pago
  const cobranzaMap = new Map<string, { cantidadPedidos: number; total: number; saldo: number }>();
  for (const p of pedidos) {
    const ep = p.estadoPago;
    const existing = cobranzaMap.get(ep) ?? { cantidadPedidos: 0, total: 0, saldo: 0 };
    existing.cantidadPedidos += 1;
    existing.total += p.precioTotal;
    existing.saldo += p.saldoRestante;
    cobranzaMap.set(ep, existing);
  }
  const cobranza = Array.from(cobranzaMap.entries()).map(([estadoPago, v]) => ({
    estadoPago,
    ...v,
  }));

  // Datos para gráficos (por nombre de producto, sin talle)
  const graficoPorNombreUnidades = new Map<string, number>();
  const graficoPorNombreGanancia = new Map<string, number>();
  for (const p of pedidos) {
    const n = p.productoNombre;
    graficoPorNombreUnidades.set(n, (graficoPorNombreUnidades.get(n) ?? 0) + p.cantidad);
    graficoPorNombreGanancia.set(n, (graficoPorNombreGanancia.get(n) ?? 0) + p.ganancia);
  }
  const chartUnidades = Array.from(graficoPorNombreUnidades.entries()).map(([name, value]) => ({ name, value }));
  const chartGanancia = Array.from(graficoPorNombreGanancia.entries()).map(([name, value]) => ({ name, value }));

  return NextResponse.json({ periodo, metricas, ranking, cobranza, chartUnidades, chartGanancia });
}
