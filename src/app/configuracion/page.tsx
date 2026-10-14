"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { INFO_SECCION, SECCIONES, seccionesActivas, type ConfigSecciones } from "@/lib/secciones";
import { PageHeader } from "@/components/shared/PageHeader";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { useConfiguracion } from "@/components/layout/ConfiguracionProvider";

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-[17px] font-bold">{titulo}</h2>
      {children}
    </section>
  );
}

function Interruptor({ activo }: { activo: boolean }) {
  return (
    <span
      role="switch"
      aria-checked={activo}
      className={cn(
        "flex h-[34px] w-[58px] shrink-0 rounded-full p-[3px] transition-all",
        activo ? "justify-end bg-[hsl(152_55%_36%)]" : "justify-start bg-[hsl(210_25%_84%)]"
      )}
    >
      <span className="h-7 w-7 rounded-full bg-white shadow" />
    </span>
  );
}

function ConfiguracionContenido() {
  const router = useRouter();
  const seccionParam = useSearchParams().get("seccion");
  const { secciones, activas } = useConfiguracion();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seccionHeader = activas.find((s) => s === seccionParam) ?? activas[0];

  async function alternar(clave: (typeof SECCIONES)[number]) {
    const nueva: ConfigSecciones = { ...secciones, [clave]: !secciones[clave] };
    if (seccionesActivas(nueva).length === 0) {
      setError("Tiene que quedar al menos una sección activa.");
      return;
    }
    setError(null);
    setGuardando(true);
    const res = await fetch("/api/configuracion", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secciones: nueva }),
    });
    setGuardando(false);
    if (!res.ok) {
      setError("No se pudo guardar. Probá de nuevo.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <MobileHeader seccion={seccionHeader} title="Configuración" />
      <div className="hidden md:block">
        <PageHeader title="Configuración" description="Qué secciones se muestran en la app" />
      </div>

      <div className="max-w-2xl space-y-8">
        <Bloque titulo="Secciones visibles">
          <p className="text-sm text-muted-foreground">
            Las secciones apagadas se ocultan del menú. Sus datos se conservan y vuelven al activarlas.
          </p>
          <div className="overflow-hidden rounded-[14px] border">
            {SECCIONES.map((s) => (
              <button
                key={s}
                type="button"
                disabled={guardando}
                onClick={() => alternar(s)}
                className="flex min-h-14 w-full items-center justify-between gap-3 border-b px-4 py-2 text-left last:border-b-0 disabled:opacity-60"
              >
                <div>
                  <div className="text-[15px] font-medium">{INFO_SECCION[s].nombre}</div>
                  <div className="text-xs text-muted-foreground">{INFO_SECCION[s].subtitulo}</div>
                </div>
                <Interruptor activo={secciones[s]} />
              </button>
            ))}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </Bloque>
      </div>
    </div>
  );
}

export default function ConfiguracionPage() {
  return (
    <Suspense fallback={null}>
      <ConfiguracionContenido />
    </Suspense>
  );
}
