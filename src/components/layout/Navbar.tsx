"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { esRutaOculta } from "@/lib/modoCliente";
import { INFO_SECCION } from "@/lib/secciones";
import { useModoCliente } from "./ModoClienteProvider";
import { useConfiguracion } from "./ConfiguracionProvider";
import { ModoClienteToggle } from "./ModoClienteToggle";
import { NAV_ESCRITORIO } from "./navSecciones";

export function Navbar() {
  const pathname = usePathname();
  const { modoCliente } = useModoCliente();
  const { activas } = useConfiguracion();
  const [plegados, setPlegados] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("nav-plegados") ?? "[]");
    } catch {
      return [];
    }
  });
  const alternar = (label: string) => {
    const nuevo = plegados.includes(label) ? plegados.filter((l) => l !== label) : [...plegados, label];
    setPlegados(nuevo);
    try {
      localStorage.setItem("nav-plegados", JSON.stringify(nuevo));
    } catch {}
  };
  const grupos = activas.map((s) => ({ label: INFO_SECCION[s].nombre, items: NAV_ESCRITORIO[s] }));

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
        {grupos.map((group) => (
          <div key={group.label}>
            <button
              type="button"
              onClick={() => alternar(group.label)}
              aria-expanded={!plegados.includes(group.label)}
              suppressHydrationWarning
              className="mb-1 flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left hover:bg-accent"
            >
              <span className="text-[13px] font-extrabold uppercase tracking-wide text-foreground">
                {group.label}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  plegados.includes(group.label) && "-rotate-90"
                )}
              />
            </button>
            <div suppressHydrationWarning className={cn("space-y-0.5", plegados.includes(group.label) && "hidden")}>
              {group.items
                .filter(({ href }) => !(modoCliente && esRutaOculta(href)))
                .map(({ href, label, icon: Icon }) => (
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
      <div className="border-t p-2 space-y-0.5">
        {!modoCliente && (
          <Link
            href="/configuracion"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === "/configuracion"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            Configuración
          </Link>
        )}
        <ModoClienteToggle />
      </div>
    </aside>
  );
}
