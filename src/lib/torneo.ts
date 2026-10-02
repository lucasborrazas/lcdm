export const NOMBRES_MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function nombreTorneo(mes: number, anio: number): string {
  return `${NOMBRES_MESES[mes - 1]} ${anio}`;
}

export const EDADES_DISPONIBLES = Array.from({ length: 13 }, (_, i) => (i + 3).toString());

export const ESTADOS_TORNEO = [
  { value: "PLANIFICADO", label: "Planificado" },
  { value: "EN_CURSO", label: "En curso" },
  { value: "FINALIZADO", label: "Finalizado" },
] as const;

export function labelEstadoTorneo(estado: string): string {
  return ESTADOS_TORNEO.find((e) => e.value === estado)?.label ?? estado;
}

export const PALETA_HORARIOS = [
  { pill: "bg-blue-500/15 text-blue-700", kpi: "bg-blue-500/10", hex: "#3b82f6" },
  { pill: "bg-violet-500/15 text-violet-700", kpi: "bg-violet-500/10", hex: "#8b5cf6" },
  { pill: "bg-pink-500/15 text-pink-700", kpi: "bg-pink-500/10", hex: "#ec4899" },
  { pill: "bg-teal-500/15 text-teal-700", kpi: "bg-teal-500/10", hex: "#14b8a6" },
  { pill: "bg-amber-500/15 text-amber-800", kpi: "bg-amber-500/10", hex: "#f59e0b" },
  { pill: "bg-cyan-500/15 text-cyan-700", kpi: "bg-cyan-500/10", hex: "#06b6d4" },
  { pill: "bg-rose-500/15 text-rose-700", kpi: "bg-rose-500/10", hex: "#f43f5e" },
  { pill: "bg-lime-500/15 text-lime-800", kpi: "bg-lime-500/10", hex: "#84cc16" },
] as const;

export function colorHorario(orden: number) {
  return PALETA_HORARIOS[((orden % PALETA_HORARIOS.length) + PALETA_HORARIOS.length) % PALETA_HORARIOS.length];
}

export function montoPorMetodoPago(
  torneo: { precioEfectivo: number; precioTransferencia: number },
  metodoPago: "EFECTIVO" | "TRANSFERENCIA" | null | undefined
): number | null {
  if (metodoPago === "EFECTIVO") return torneo.precioEfectivo;
  if (metodoPago === "TRANSFERENCIA") return torneo.precioTransferencia;
  return null;
}
