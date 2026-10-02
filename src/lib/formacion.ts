export type LineaFormacion = "ARQ" | "DEF" | "MED" | "DEL";

// Orden de llegada -> posición. Los primeros 7 arman un 1-2-2-2 (fútbol 7);
// de ahí en más va escalando hacia un 1-4-4-2 (11 jugadores).
export const FORMACION_SLOTS: LineaFormacion[] = [
  "ARQ", "DEF", "DEF", "MED", "MED", "DEL", "DEL", "DEF", "MED", "DEF", "MED",
];

const Y_POR_LINEA: Record<LineaFormacion, number> = {
  ARQ: 90,
  DEF: 68,
  MED: 42,
  DEL: 16,
};

export type JugadorEnCancha<T> = {
  jugador: T;
  numero: number;
  linea: LineaFormacion;
  xPct: number;
  yPct: number;
};

export function calcularFormacion<T>(jugadoresOrdenados: T[]): JugadorEnCancha<T>[] {
  const lineaDe = (indice: number): LineaFormacion =>
    indice < FORMACION_SLOTS.length ? FORMACION_SLOTS[indice] : "DEL";

  const lineas: Record<LineaFormacion, number[]> = { ARQ: [], DEF: [], MED: [], DEL: [] };
  jugadoresOrdenados.forEach((_, i) => lineas[lineaDe(i)].push(i));

  return jugadoresOrdenados.map((jugador, i) => {
    const linea = lineaDe(i);
    const indiceEnLinea = lineas[linea].indexOf(i);
    const cantidadEnLinea = lineas[linea].length;
    const xPct = ((indiceEnLinea + 1) / (cantidadEnLinea + 1)) * 100;

    return {
      jugador,
      numero: i + 1,
      linea,
      xPct,
      yPct: Y_POR_LINEA[linea],
    };
  });
}
