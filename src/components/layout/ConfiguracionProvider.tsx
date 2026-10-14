"use client";

import { createContext, useContext } from "react";
import { CONFIG_POR_DEFECTO, seccionesActivas, type ConfigSecciones, type Seccion } from "@/lib/secciones";

type ConfiguracionCtx = { secciones: ConfigSecciones; activas: Seccion[] };

const Ctx = createContext<ConfiguracionCtx>({
  secciones: CONFIG_POR_DEFECTO,
  activas: seccionesActivas(CONFIG_POR_DEFECTO),
});

// La config se lee en el layout (servidor); al guardarla se hace router.refresh()
// y el layout vuelve a pasar los valores nuevos.
export function ConfiguracionProvider({
  secciones,
  children,
}: {
  secciones: ConfigSecciones;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={{ secciones, activas: seccionesActivas(secciones) }}>{children}</Ctx.Provider>;
}

export function useConfiguracion() {
  return useContext(Ctx);
}
