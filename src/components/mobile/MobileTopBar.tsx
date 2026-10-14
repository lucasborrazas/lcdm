"use client";

import { usePathname } from "next/navigation";
import { useModoCliente } from "@/components/layout/ModoClienteProvider";
import { seccionDeRuta } from "@/lib/secciones";
import { useConfiguracion } from "@/components/layout/ConfiguracionProvider";
import { BotonOjo, EyebrowSeccion } from "./MobileHeader";

// Barra superior mobile global: franja "Modo cliente" y, en las pantallas de
// Indumentaria (que conservan su propio PageHeader), el selector de seccion
// y el ojo. Torneo, Mas y Configuracion dibujan su propio encabezado.
export function MobileTopBar() {
  const pathname = usePathname();
  const { modoCliente } = useModoCliente();
  const { activas } = useConfiguracion();
  const propio =
    pathname.startsWith("/torneo") || pathname.startsWith("/mas") || pathname.startsWith("/configuracion");

  return (
    <div className="md:hidden">
      {modoCliente && (
        <div className="-mx-4 -mt-4 mb-3 flex h-[26px] items-center justify-center bg-[hsl(209_65%_93%)] text-xs font-semibold text-primary">
          Modo cliente · costos y ganancias ocultos
        </div>
      )}
      {!propio && (
        <div className="mb-3 flex items-center justify-between">
          <EyebrowSeccion seccion={seccionDeRuta(pathname) ?? activas[0]} />
          <BotonOjo />
        </div>
      )}
    </div>
  );
}
