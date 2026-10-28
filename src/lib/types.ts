import type { Producto, Stock, Pedido, PedidoGrupo, MovimientoStock, HistorialPrecios, PedidoEliminado, Horario, InscripcionTorneo, Torneo, GrupoEdad, GastoTorneo, EntregaPremios, TurnoEntrega, FamiliaEntrega, ChicoEntrega, GastoEntrega } from "@/generated/prisma/client";

export type { GastoTorneo, GastoEntrega };

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

// Entrega de premios

export type TurnoConConteo = TurnoEntrega & {
  grupoEdad: GrupoEdad | null;
  cantidadFamilias: number;
};

export type FamiliaConChicos = FamiliaEntrega & {
  chicos: ChicoEntrega[];
  turno: TurnoEntrega & { grupoEdad: GrupoEdad | null };
};

export type EntregaConResumen = EntregaPremios & {
  cantidadTurnos: number;
  cantidadChicos: number;
  masculino: number;
  femenino: number;
  cobrado: number;
  pendiente: number;
  totalGastos: number;
  ganancia: number;
};
