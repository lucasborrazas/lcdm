export type Equipo = "ROJO" | "AMARILLO" | "NARANJA";
export type PestanaEquipo = "SIN" | Equipo;

export const EQUIPOS: Equipo[] = ["ROJO", "AMARILLO", "NARANJA"];

export const EQUIPO_MOBILE: Record<Equipo, { nombre: string; corto: string; bg: string; fg: string }> = {
  ROJO: { nombre: "Rojo", corto: "Rojo", bg: "#dc2626", fg: "#ffffff" },
  AMARILLO: { nombre: "Amarillo", corto: "Amar.", bg: "#facc15", fg: "#422006" },
  NARANJA: { nombre: "Naranja", corto: "Naranja", bg: "#f97316", fg: "#ffffff" },
};

type ConEquipo = {
  nombre: string;
  equipo: Equipo | null;
  equipoAsignadoAt: Date | string | null;
};

function tiempo(i: ConEquipo): number {
  return i.equipoAsignadoAt ? new Date(i.equipoAsignadoAt).getTime() : 0;
}

// Orden de llegada al equipo (define el numero de camiseta y la formacion).
export function ordenarPorAsignacion<T extends ConEquipo>(lista: T[]): T[] {
  return [...lista].sort((a, b) => tiempo(a) - tiempo(b));
}

export function agruparPorEquipo<T extends ConEquipo>(
  lista: T[]
): Record<PestanaEquipo, T[]> {
  const grupos: Record<PestanaEquipo, T[]> = { SIN: [], ROJO: [], AMARILLO: [], NARANJA: [] };
  for (const i of lista) grupos[i.equipo ?? "SIN"].push(i);
  for (const e of EQUIPOS) grupos[e] = ordenarPorAsignacion(grupos[e]);
  return grupos;
}

// "Lola Díaz" -> "Lola D."; "Lola" -> "Lola"
export function nombreCorto(nombre: string): string {
  const [primero, ...resto] = nombre.trim().split(/\s+/);
  const inicial = resto[0]?.[0];
  return inicial ? `${primero} ${inicial.toUpperCase()}.` : primero ?? "";
}
