import type { Producto, Stock, Pedido, MovimientoStock, HistorialPrecios } from "@/generated/prisma/client";

export type ProductoConStock = Producto & {
  stock: Stock | null;
  stockActual: number;
  gananciaUnitaria: number | null;
};

export type PedidoConProducto = Pedido & {
  producto: Producto;
};

export type MovimientoConProducto = MovimientoStock & {
  producto: Producto;
};

export type HistorialConProducto = HistorialPrecios & {
  producto: Producto;
};

export type DashboardMetricas = {
  totalVendido: number;
  cantidadPedidos: number;
  unidadesVendidas: number;
  costoTotal: number;
  gananciaTotal: number;
  margenPct: number;
  totalSenas: number;
  saldoPendiente: number;
};

export type RankingProducto = {
  productoNombre: string;
  talle: string;
  genero: string;
  temporada: string;
  unidadesVendidas: number;
  ventas: number;
  ganancia: number;
};

export type CobranzaEstado = {
  estadoPago: string;
  cantidadPedidos: number;
  total: number;
  saldo: number;
};

export type StockResumen = {
  productoId: string;
  temporada: string;
  genero: string;
  nombre: string;
  talle: string;
  stockInicial: number;
  ingresos: number;
  egresos: number;
  stockActual: number;
  alertaMinimo: number | null;
  stockBajo: boolean;
};
