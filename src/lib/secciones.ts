// Secciones de la app que se pueden activar u ocultar desde Configuracion.

export type Seccion = "ind" | "tor" | "pre";

export type ConfigSecciones = Record<Seccion, boolean>;

export const SECCIONES: Seccion[] = ["ind", "tor", "pre"];

type InfoSeccion = {
  nombre: string;
  subtitulo: string;
  // Ruta a la que se entra al elegir la seccion.
  inicio: string;
  // Rutas que pertenecen a la seccion ("/" solo coincide exacta).
  rutas: string[];
};

export const INFO_SECCION: Record<Seccion, InfoSeccion> = {
  ind: {
    nombre: "Indumentaria",
    subtitulo: "Pedidos y stock",
    inicio: "/pedidos",
    rutas: ["/", "/pedidos", "/productos", "/stock", "/movimientos", "/historial"],
  },
  tor: {
    nombre: "Torneo",
    subtitulo: "Inscripciones y equipos",
    inicio: "/torneo/inscripciones",
    rutas: ["/torneo"],
  },
  pre: {
    nombre: "Entrega de premios",
    subtitulo: "Familias, bonos y gastos",
    inicio: "/premios/inscripciones",
    rutas: ["/premios"],
  },
};

export const CONFIG_POR_DEFECTO: ConfigSecciones = { ind: true, tor: true, pre: false };

function coincide(pathname: string, ruta: string): boolean {
  return ruta === "/" ? pathname === "/" : pathname === ruta || pathname.startsWith(`${ruta}/`);
}

// Seccion a la que pertenece una ruta (null para /configuracion, /mas, etc.).
export function seccionDeRuta(pathname: string): Seccion | null {
  return SECCIONES.find((s) => INFO_SECCION[s].rutas.some((r) => coincide(pathname, r))) ?? null;
}

export function seccionesActivas(config: ConfigSecciones): Seccion[] {
  return SECCIONES.filter((s) => config[s]);
}

// Si la ruta es de una seccion apagada devuelve a donde redirigir; si no, null.
export function redireccionSeccionApagada(pathname: string, config: ConfigSecciones): string | null {
  const seccion = seccionDeRuta(pathname);
  if (!seccion || config[seccion]) return null;
  const primera = seccionesActivas(config)[0];
  return primera ? INFO_SECCION[primera].inicio : "/configuracion";
}

// Garantiza al menos una seccion activa: si todas vienen apagadas, queda la primera.
export function normalizarConfig(config: ConfigSecciones): ConfigSecciones {
  return seccionesActivas(config).length > 0 ? config : { ...config, [SECCIONES[0]]: true };
}
