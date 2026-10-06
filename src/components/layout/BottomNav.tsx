"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  ClipboardList,
  Users,
  CalendarDays,
  Wallet,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { esRutaOculta } from "@/lib/modoCliente";
import { useModoCliente } from "./ModoClienteProvider";
import type { Seccion } from "@/components/mobile/MobileHeader";

const NAV_TORNEO = [
  { href: "/torneo/resumen", label: "Resumen", icon: Wallet },
  { href: "/torneo/inscripciones", label: "Inscrip.", icon: ClipboardList },
  { href: "/torneo/equipos", label: "Equipos", icon: Users },
  { href: "/torneo/historial", label: "Historial", icon: CalendarDays },
  { href: "/mas?seccion=tor", label: "Más", icon: Menu },
];

const NAV_INDUMENTARIA = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/productos", label: "Productos", icon: Package },
  { href: "/stock", label: "Stock", icon: Boxes },
  { href: "/mas?seccion=ind", label: "Más", icon: Menu },
];

// Pantallas de Indumentaria que viven dentro de "Más".
const SUBPANTALLAS_MAS = ["/movimientos", "/historial"];

function seccionActual(pathname: string, seccionParam: string | null): Seccion {
  if (pathname.startsWith("/torneo")) return "tor";
  if (pathname.startsWith("/mas")) return seccionParam === "tor" ? "tor" : "ind";
  return "ind";
}

export function BottomNav() {
  const pathname = usePathname();
  const seccionParam = useSearchParams().get("seccion");
  const { modoCliente } = useModoCliente();

  const seccion = seccionActual(pathname, seccionParam);
  const items = (seccion === "tor" ? NAV_TORNEO : NAV_INDUMENTARIA).filter(
    ({ href }) => !(modoCliente && esRutaOculta(href))
  );
  const enMas = pathname.startsWith("/mas") || SUBPANTALLAS_MAS.some((r) => pathname.startsWith(r));

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
