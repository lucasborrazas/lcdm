import type { Producto, Stock, Pedido, PedidoGrupo, MovimientoStock, HistorialPrecios, PedidoEliminado, Horario, InscripcionTorneo, Torneo, GrupoEdad, GastoTorneo } from "@/generated/prisma/client";

export type { GastoTorneo };

export type ProductoConStock = Producto & {
  stock: Stock | null;
  stockActual: number;
  gananciaUnitaria: number | null;
};

export type PedidoConProducto = Pedido & {
  producto: Producto;
  pedidoGrupo: PedidoGrupo | null;
};

export type MovimientoConProducto = MovimientoStock & {
  producto: Producto;
};

export type HistorialConProducto = HistorialPrecios & {
  producto: Producto;
};

export type { PedidoEliminado };

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

export type HorarioConCupo = Horario & {
  grupoEdad: GrupoEdad;
  inscriptos: number;
};

export type InscripcionConHorario = InscripcionTorneo & {
  horario: Horario & { grupoEdad: GrupoEdad };
};

export type TorneoConResumen = Torneo & {
  cantidadHorarios: number;
  cantidadInscriptos: number;
  recaudado: number;
  totalGastos: number;
  ganancia: number;
};

export type StockResumen = {
  productoId: string;
  temporada: string;
  genero: string;
  nombre: string;
  talle: string;
  archivado: boolean;
  stockInicial: number;
  ingresos: number;
  egresos: number;
  stockActual: number;
  alertaMinimo: number | null;
  stockBajo: boolean;
};
