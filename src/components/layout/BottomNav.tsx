"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ArrowLeftRight,
  ShoppingCart,
  History,
  ClipboardList,
  Users,
  CalendarDays,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { esRutaOculta } from "@/lib/modoCliente";
import { useModoCliente } from "./ModoClienteProvider";
import { ModoClienteToggle } from "./ModoClienteToggle";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/productos", label: "Productos", icon: Package },
  { href: "/stock", label: "Stock", icon: Boxes },
  { href: "/movimientos", label: "Movim.", icon: ArrowLeftRight },
  { href: "/historial", label: "Historial", icon: History },
  { href: "/torneo/resumen", label: "Resumen", icon: Wallet },
  { href: "/torneo/inscripciones", label: "Inscrip.", icon: ClipboardList },
  { href: "/torneo/equipos", label: "Equipos", icon: Users },
  { href: "/torneo/historial", label: "Torneos", icon: CalendarDays },
];

export function BottomNav() {
  const pathname = usePathname();
  const { modoCliente } = useModoCliente();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t z-30 flex overflow-x-auto">
      {NAV_ITEMS.filter(({ href }) => !(modoCliente && esRutaOculta(href))).map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex flex-col items-center gap-0.5 py-2 px-3 text-[10px] font-medium transition-colors shrink-0",
            pathname === href
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          <Icon className="h-5 w-5" />
          {label}
        </Link>
      ))}
      <ModoClienteToggle variant="bottom" />
    </nav>
  );
}
