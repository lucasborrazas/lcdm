"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { esRutaOculta } from "@/lib/modoCliente";
import { seccionDeRuta, type Seccion } from "@/lib/secciones";
import { useModoCliente } from "./ModoClienteProvider";
import { useConfiguracion } from "./ConfiguracionProvider";
import { NAV_MOBILE, SUBPANTALLAS_MAS } from "./navSecciones";

// Seccion cuya barra se muestra. En pantallas sin seccion (Mas, Configuracion)
// manda el parametro ?seccion= y, si no hay, la primera activa.
function seccionActual(pathname: string, seccionParam: string | null, activas: Seccion[]): Seccion {
  const deRuta = seccionDeRuta(pathname);
  if (deRuta) return deRuta;
  return activas.find((s) => s === seccionParam) ?? activas[0];
}

export function BottomNav() {
  const pathname = usePathname();
  const seccionParam = useSearchParams().get("seccion");
  const { modoCliente } = useModoCliente();
  const { activas } = useConfiguracion();

  const seccion = seccionActual(pathname, seccionParam, activas);
  const items = NAV_MOBILE[seccion].filter(({ href }) => !(modoCliente && esRutaOculta(href)));
  const enMas =
    pathname.startsWith("/mas") ||
    pathname.startsWith("/configuracion") ||
    SUBPANTALLAS_MAS[seccion].some((r) => pathname.startsWith(r));

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-stretch gap-1 border-t bg-card px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 h-[calc(76px+env(safe-area-inset-bottom))]">
      {items.map(({ href, label, icon: Icon }) => {
        const esMas = href.startsWith("/mas");
        const activo = esMas ? enMas : pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-[3px] rounded-xl text-[11px] font-semibold transition-colors",
              activo
                ? "bg-[hsl(209_65%_95%)] text-primary"
                : "text-[hsl(220_15%_50%)]"
            )}
          >
            <Icon className="h-[22px] w-[22px]" strokeWidth={activo ? 2.4 : 1.9} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
