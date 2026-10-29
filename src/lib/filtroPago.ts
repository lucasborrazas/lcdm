// Filtro Todos / Sin pagar / Pagaron, comun a Torneo y Entrega de premios.
// Cada seccion dice que significa "pago" para sus elementos.
export type FiltroPago = "todos" | "sin" | "pagaron";

export const OPCIONES_FILTRO_PAGO: { value: FiltroPago; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "sin", label: "Sin pagar" },
  { value: "pagaron", label: "Pagaron" },
];

export function filtrarPorPago<T>(items: T[], filtro: FiltroPago, pago: (item: T) => boolean): T[] {
  if (filtro === "sin") return items.filter((i) => !pago(i));
  if (filtro === "pagaron") return items.filter(pago);
  return items;
}

export function contarPorPago<T>(items: T[], pago: (item: T) => boolean) {
  const pagaron = items.filter(pago).length;
  return { todos: items.length, sin: items.length - pagaron, pagaron };
}
