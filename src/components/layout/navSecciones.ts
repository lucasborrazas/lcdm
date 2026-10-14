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
  Menu,
  type LucideIcon,
} from "lucide-react";
import type { Seccion } from "@/lib/secciones";

type Item = { href: string; label: string; icon: LucideIcon };

// Menu lateral (escritorio) de cada seccion.
export const NAV_ESCRITORIO: Record<Seccion, Item[]> = {
  ind: [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pedidos", label: "Pedidos", icon: ShoppingCart },
    { href: "/productos", label: "Productos", icon: Package },
    { href: "/stock", label: "Stock", icon: Boxes },
    { href: "/movimientos", label: "Movimientos", icon: ArrowLeftRight },
    { href: "/historial", label: "Historial", icon: History },
  ],
  tor: [
    { href: "/torneo/resumen", label: "Resumen", icon: Wallet },
    { href: "/torneo/inscripciones", label: "Inscripciones", icon: ClipboardList },
    { href: "/torneo/equipos", label: "Equipos", icon: Users },
    { href: "/torneo/historial", label: "Historial", icon: CalendarDays },
  ],
  pre: [
    { href: "/premios/resumen", label: "Resumen", icon: Wallet },
    { href: "/premios/inscripciones", label: "Inscripciones", icon: ClipboardList },
    { href: "/premios/historial", label: "Historial", icon: CalendarDays },
  ],
};

// Barra inferior (mobile) de cada seccion; "Mas" siempre al final.
export const NAV_MOBILE: Record<Seccion, Item[]> = {
  ind: [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pedidos", label: "Pedidos", icon: ShoppingCart },
    { href: "/productos", label: "Productos", icon: Package },
    { href: "/stock", label: "Stock", icon: Boxes },
    { href: "/mas?seccion=ind", label: "Más", icon: Menu },
  ],
  tor: [
    { href: "/torneo/resumen", label: "Resumen", icon: Wallet },
    { href: "/torneo/inscripciones", label: "Inscrip.", icon: ClipboardList },
    { href: "/torneo/equipos", label: "Equipos", icon: Users },
    { href: "/torneo/historial", label: "Historial", icon: CalendarDays },
    { href: "/mas?seccion=tor", label: "Más", icon: Menu },
  ],
  pre: [
    { href: "/premios/resumen", label: "Resumen", icon: Wallet },
    { href: "/premios/inscripciones", label: "Inscrip.", icon: ClipboardList },
    { href: "/premios/historial", label: "Historial", icon: CalendarDays },
    { href: "/mas?seccion=pre", label: "Más", icon: Menu },
  ],
};

// Pantallas que viven dentro de "Mas" de cada seccion.
export const SUBPANTALLAS_MAS: Record<Seccion, string[]> = {
  ind: ["/movimientos", "/historial"],
  tor: [],
  pre: [],
};
