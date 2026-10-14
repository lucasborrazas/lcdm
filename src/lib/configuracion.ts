import { prisma } from "@/lib/prisma";
import { CONFIG_POR_DEFECTO, normalizarConfig, type ConfigSecciones } from "@/lib/secciones";
import { PRECIOS_POR_DEFECTO, type PreciosConfig } from "@/lib/preciosConfig";

export type ConfiguracionApp = { secciones: ConfigSecciones; precios: PreciosConfig };

// Solo servidor. Si todavia no hay fila, rigen los valores por defecto.
export async function leerConfiguracion(): Promise<ConfiguracionApp> {
  const fila = await prisma.configuracion.findUnique({ where: { id: "singleton" } });
  if (!fila) return { secciones: CONFIG_POR_DEFECTO, precios: PRECIOS_POR_DEFECTO };
  return {
    secciones: normalizarConfig({ ind: fila.indumentariaActiva, tor: fila.torneoActivo, pre: fila.premiosActivo }),
    precios: {
      torneoEfectivo: fila.precioTorneoEfectivo,
      torneoTransferencia: fila.precioTorneoTransferencia,
      bonoTransferencia: fila.bonoPrecioTransferencia,
      bonoDescuentoEfectivoPct: fila.bonoDescuentoEfectivoPct,
    },
  };
}

export async function leerConfigSecciones(): Promise<ConfigSecciones> {
  return (await leerConfiguracion()).secciones;
}
