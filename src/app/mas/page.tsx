"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useModoCliente } from "@/components/layout/ModoClienteProvider";
import { MobileHeader, NOMBRE_SECCION, RUTA_INICIO_SECCION, type Seccion } from "@/components/mobile/MobileHeader";
import { EtiquetaSeccion } from "@/components/mobile/ui";

const SUBTITULO: Record<Seccion, string> = {
  tor: "Inscripciones y equipos",
  ind: "Pedidos y stock",
};

type Fila = { href: string; label: string; sub: string };

function MasContenido() {
  const seccionParam = useSearchParams().get("seccion");
  const seccion: Seccion = seccionParam === "tor" ? "tor" : "ind";
  const { modoCliente, toggle } = useModoCliente();

  const filas: Fila[] =
    seccion === "tor"
      ? [{ href: "/torneo/inscripciones?gestionar=1", label: "Gestionar torneo", sub: "Precios, estado y horarios" }]
      : modoCliente
        ? []
        : [
            { href: "/movimientos", label: "Movimientos", sub: "Ingresos y egresos de mercadería" },
            { href: "/historial", label: "Historial", sub: "Precios y pedidos eliminados" },
          ];

  return (
    <div>
      <MobileHeader seccion={seccion} title="Más" />
      <div className="flex flex-col gap-2.5">
        <EtiquetaSeccion>Sección</EtiquetaSeccion>
        <div className="flex gap-2">
          {(["tor", "ind"] as Seccion[]).map((s) => (
            <Link
              key={s}
              href={RUTA_INICIO_SECCION[s]}
              className={cn(
                "min-h-[72px] flex-1 rounded-[14px] p-3.5",
                seccion === s ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              )}
            >
              <div className="text-[15px] font-bold">{NOMBRE_SECCION[s]}</div>
              <div className="text-xs opacity-85">{SUBTITULO[s]}</div>
            </Link>
          ))}
        </div>

        <div className="mt-2">
          <EtiquetaSeccion>{seccion === "tor" ? "Gestionar torneo" : "Indumentaria"}</EtiquetaSeccion>
        </div>
        <div className="overflow-hidden rounded-[14px] border">
          {filas.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="flex min-h-14 items-center justify-between gap-2.5 border-b px-4 py-1.5 last:border-b-0"
            >
              <div>
                <div className="text-[15px] font-medium">{f.label}</div>
                <div className="text-xs text-muted-foreground">{f.sub}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
          {filas.length === 0 && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Movimientos e Historial están ocultos en modo cliente
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggle}
          className="mt-1.5 flex items-center justify-between gap-3 rounded-[14px] border px-4 py-3 text-left"
        >
          <div>
            <div className="text-[15px] font-semibold">Modo cliente</div>
            <div className="text-xs text-muted-foreground">
              Oculta costos, ganancias y secciones internas para mostrar la pantalla a un cliente
            </div>
          </div>
          <span
            role="switch"
            aria-checked={modoCliente}
            className={cn(
              "flex h-[34px] w-[58px] shrink-0 rounded-full p-[3px] transition-all",
              modoCliente ? "justify-end bg-[hsl(152_55%_36%)]" : "justify-start bg-[hsl(210_25%_84%)]"
            )}
          >
            <span className="h-7 w-7 rounded-full bg-white shadow" />
          </span>
        </button>
      </div>
    </div>
  );
}

export default function MasPage() {
  return (
    <Suspense fallback={null}>
      <MasContenido />
    </Suspense>
  );
}
