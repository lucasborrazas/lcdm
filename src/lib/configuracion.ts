import { prisma } from "@/lib/prisma";
import { CONFIG_POR_DEFECTO, normalizarConfig, type ConfigSecciones } from "@/lib/secciones";

// Solo servidor. Si todavia no hay fila, rige la config por defecto.
export async function leerConfigSecciones(): Promise<ConfigSecciones> {
  const fila = await prisma.configuracion.findUnique({ where: { id: "singleton" } });
  if (!fila) return CONFIG_POR_DEFECTO;
  return normalizarConfig({
    ind: fila.indumentariaActiva,
    tor: fila.torneoActivo,
    pre: fila.premiosActivo,
  });
}
