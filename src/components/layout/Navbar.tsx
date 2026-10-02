"use client";

import Image from "next/image";
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
import { Badge } from "@/components/ui/badge";

const NAV_GROUPS = [
  {
    label: "Indumentaria",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/pedidos", label: "Pedidos", icon: ShoppingCart },
      { href: "/productos", label: "Productos", icon: Package },
      { href: "/stock", label: "Stock", icon: Boxes },
      { href: "/movimientos", label: "Movimientos", icon: ArrowLeftRight },
      { href: "/historial", label: "Historial", icon: History },
    ],
  },
  {
    label: "Torneo",
    badge: "Beta",
    items: [
      { href: "/torneo/resumen", label: "Resumen", icon: Wallet },
      { href: "/torneo/inscripciones", label: "Inscripciones", icon: ClipboardList },
      { href: "/torneo/equipos", label: "Equipos", icon: Users },
      { href: "/torneo/historial", label: "Historial", icon: CalendarDays },
    ],
  },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-56 flex-col border-r bg-card z-30">
      <div className="px-4 py-4 border-b flex items-center">
        <Image
          src="/logo.png"
          alt="Campeones del Mundo"
          width={160}
          height={174}
          className="h-12 w-auto"
          priority
        />
      </div>
      <nav className="flex-1 py-3 px-2 space-y-4 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="flex items-center gap-1.5 px-3 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </span>
              {group.badge && (
                <Badge variant="secondary" className="h-4 px-1 text-[9px] leading-none">
                  {group.badge}
                </Badge>
              )}
            </div>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
