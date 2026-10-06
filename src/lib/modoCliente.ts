export const MODO_CLIENTE_COOKIE = "modo-cliente";

// Secciones que se esconden por completo en modo cliente (costos, ganancias
// y todo lo que los muestra).
export const RUTAS_OCULTAS_MODO_CLIENTE = [
  "/",
  "/historial",
  "/movimientos",
  "/torneo/resumen",
  "/torneo/historial",
];

export function esRutaOculta(pathname: string): boolean {
  return RUTAS_OCULTAS_MODO_CLIENTE.some((r) =>
    r === "/" ? pathname === "/" : pathname === r || pathname.startsWith(`${r}/`)
  );
}
