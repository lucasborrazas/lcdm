import { z } from "zod";

// Escenario "que pasaria si" del Resumen de Torneo. Se guarda por torneo y
// nunca modifica inscripciones ni costos reales.
export const simulacionSchema = z.object({
  todosPagan: z.boolean(),
  // Porcentaje (0 a 100) de los pendientes y la gente extra que paga en efectivo.
  pctEfectivo: z.number().int().min(0).max(100),
  // Gente extra por horario real: horarioId -> cantidad.
  extras: z.record(z.string(), z.number().int().nonnegative()),
  horarios: z.array(
    z.object({
      id: z.string().min(1),
      hora: z.string().trim(),
      etiqueta: z.string().trim(),
      cupo: z.number().int().positive().nullable(),
      personas: z.number().int().nonnegative(),
    })
  ),
  costos: z.array(
    z.object({
      id: z.string().min(1),
      concepto: z.string().trim().min(1),
      monto: z.number().int().nonnegative(),
    })
  ),
});

export type Simulacion = z.infer<typeof simulacionSchema>;
export type HorarioSimulado = Simulacion["horarios"][number];
export type CostoSimulado = Simulacion["costos"][number];

export const SIMULACION_VACIA: Simulacion = {
  todosPagan: false,
  pctEfectivo: 50,
  extras: {},
  horarios: [],
  costos: [],
};

export function esSimulacionVacia(s: Simulacion): boolean {
  return (
    !s.todosPagan &&
    s.horarios.length === 0 &&
    s.costos.length === 0 &&
    Object.values(s.extras).every((n) => n === 0)
  );
}

// Lo que se espera cobrar por persona segun la mezcla efectivo/transferencia.
export function precioEsperado(
  precios: { precioEfectivo: number; precioTransferencia: number },
  pctEfectivo: number
): number {
  return Math.round((precios.precioEfectivo * pctEfectivo + precios.precioTransferencia * (100 - pctEfectivo)) / 100);
}

export type FilaSimulada = {
  id: string;
  hora: string;
  nombre: string;
  orden: number;
  cupo: number | null;
  simulado: boolean;
  reales: number;
  pagaron: number;
  extra: number;
  total: number;
  ingresoReal: number;
  ingreso: number;
  excedeCupo: boolean;
};

// Cuantos alumnos pagan con cada medio: los que ya pagaron (dato real) y los
// esperados (pendientes que pagan + gente extra), repartidos segun el %.
export type ConteoMedios = {
  pagaronEfectivo: number;
  pagaronTransferencia: number;
  esperados: number;
  esperadosEfectivo: number;
  esperadosTransferencia: number;
  pendientesSinContar: number;
};

export type ResultadoSimulacion = {
  precioPorPersona: number;
  medios: ConteoMedios;
  filas: FilaSimulada[];
  personasReales: number;
  personasSimuladas: number;
  ingresoReal: number;
  ingreso: number;
  costosReales: number;
  costos: number;
  gananciaReal: number;
  ganancia: number;
};

export function simularTorneo(
  real: {
    precios: { precioEfectivo: number; precioTransferencia: number };
    horarios: { id: string; hora: string; nombre: string; orden: number; cupoMaximo: number | null }[];
    inscripciones: { horarioId: string; pago: boolean; monto: number | null; metodoPago?: "EFECTIVO" | "TRANSFERENCIA" | null }[];
    gastos: { monto: number }[];
  },
  sim: Simulacion
): ResultadoSimulacion {
  const precio = precioEsperado(real.precios, sim.pctEfectivo);

  const filasReales: FilaSimulada[] = real.horarios.map((h) => {
    const del = real.inscripciones.filter((i) => i.horarioId === h.id);
    const pagaron = del.filter((i) => i.pago);
    const ingresoReal = pagaron.reduce((s, i) => s + (i.monto ?? 0), 0);
    const pendientes = del.length - pagaron.length;
    const extra = sim.extras[h.id] ?? 0;
    const total = del.length + extra;
    return {
      id: h.id,
      hora: h.hora,
      nombre: h.nombre,
      orden: h.orden,
      cupo: h.cupoMaximo,
      simulado: false,
      reales: del.length,
      pagaron: pagaron.length,
      extra,
      total,
      ingresoReal,
      ingreso: ingresoReal + (sim.todosPagan ? pendientes * precio : 0) + extra * precio,
      excedeCupo: h.cupoMaximo != null && total > h.cupoMaximo,
    };
  });

  const filasSimuladas: FilaSimulada[] = sim.horarios.map((h, i) => ({
    id: h.id,
    hora: h.hora,
    nombre: h.etiqueta,
    orden: real.horarios.length + i,
    cupo: h.cupo,
    simulado: true,
    reales: 0,
    pagaron: 0,
    extra: h.personas,
    total: h.personas,
    ingresoReal: 0,
    ingreso: h.personas * precio,
    excedeCupo: h.cupo != null && h.personas > h.cupo,
  }));

  const filas = [...filasReales, ...filasSimuladas];
  const ingresoReal = filasReales.reduce((s, f) => s + f.ingresoReal, 0);
  const ingreso = filas.reduce((s, f) => s + f.ingreso, 0);
  const costosReales = real.gastos.reduce((s, g) => s + g.monto, 0);
  const costos = costosReales + sim.costos.reduce((s, c) => s + c.monto, 0);

  const pagaron = real.inscripciones.filter((i) => i.pago);
  const pendientes = real.inscripciones.length - pagaron.length;
  const esperados = (sim.todosPagan ? pendientes : 0) + filas.reduce((s, f) => s + f.extra, 0);
  const esperadosEfectivo = Math.round((esperados * sim.pctEfectivo) / 100);

  return {
    precioPorPersona: precio,
    medios: {
      pagaronEfectivo: pagaron.filter((i) => i.metodoPago === "EFECTIVO").length,
      pagaronTransferencia: pagaron.filter((i) => i.metodoPago !== "EFECTIVO").length,
      esperados,
      esperadosEfectivo,
      esperadosTransferencia: esperados - esperadosEfectivo,
      pendientesSinContar: sim.todosPagan ? 0 : pendientes,
    },
    filas,
    personasReales: real.inscripciones.length,
    personasSimuladas: filas.reduce((s, f) => s + f.total, 0),
    ingresoReal,
    ingreso,
    costosReales,
    costos,
    gananciaReal: ingresoReal - costosReales,
    ganancia: ingreso - costos,
  };
}

// Parsea lo guardado; si esta corrupto o es de una version vieja, arranca vacia.
export function leerSimulacion(datos: string | null | undefined): Simulacion {
  if (!datos) return SIMULACION_VACIA;
  try {
    const r = simulacionSchema.safeParse(JSON.parse(datos));
    return r.success ? r.data : SIMULACION_VACIA;
  } catch {
    return SIMULACION_VACIA;
  }
}
