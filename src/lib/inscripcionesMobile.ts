export type FiltroPago = "todos" | "sin" | "pagaron";

type InscripcionBase = {
  nombre: string;
  pago: boolean;
  monto: number | null;
  horarioId: string;
};

// Filtros que no dependen del estado de pago: sirven para calcular los
// contadores del segmented (Todos / Sin pagar / Pagaron).
export function filtrarBase<T extends InscripcionBase>(
  inscripciones: T[],
  { q, horarioId }: { q: string; horarioId: string }
): T[] {
  const texto = q.trim().toLowerCase();
  return inscripciones.filter(
    (i) =>
      (horarioId === "all" || i.horarioId === horarioId) &&
      i.nombre.toLowerCase().includes(texto)
  );
}

export function aplicarFiltroPago<T extends InscripcionBase>(
  inscripciones: T[],
  filtro: FiltroPago
): T[] {
  if (filtro === "sin") return inscripciones.filter((i) => !i.pago);
  if (filtro === "pagaron") return inscripciones.filter((i) => i.pago);
  return inscripciones;
}

export function contadoresPago<T extends InscripcionBase>(base: T[]) {
  const pagaron = base.filter((i) => i.pago).length;
  return { todos: base.length, sin: base.length - pagaron, pagaron };
}

// "Falta cobrar" estima el monto pendiente al precio en efectivo del torneo.
export function kpisCobro<T extends InscripcionBase>(
  inscripciones: T[],
  precioEfectivo: number
) {
  const pagaron = inscripciones.filter((i) => i.pago);
  const sin = inscripciones.length - pagaron.length;
  return {
    cobrado: pagaron.reduce((s, i) => s + (i.monto ?? 0), 0),
    nPagaron: pagaron.length,
    nTotal: inscripciones.length,
    nSin: sin,
    pendiente: sin * precioEfectivo,
  };
}

export function textoCupo(inscriptos: number, cupoMaximo: number | null): string {
  if (cupoMaximo == null) return String(inscriptos);
  return inscriptos >= cupoMaximo ? "Lleno" : `${inscriptos}/${cupoMaximo}`;
}
