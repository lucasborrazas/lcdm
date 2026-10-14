"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
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
            <div className="flex items-center gap-1.5 px-3 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </span>
            </div>
            <div className="space-y-0.5">
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
