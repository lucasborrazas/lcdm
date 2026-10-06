"use client";

import { useRouter } from "next/navigation";
import { ArrowUpDown, ChevronDown, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { nombreTorneo } from "@/lib/torneo";
import type { TorneoConResumen } from "@/lib/types";
import { useModoCliente } from "@/components/layout/ModoClienteProvider";
import { BottomSheet } from "./BottomSheet";
import { useState } from "react";

export type Seccion = "tor" | "ind";

export const RUTA_INICIO_SECCION: Record<Seccion, string> = {
  tor: "/torneo/inscripciones",
  ind: "/pedidos",
};

export const NOMBRE_SECCION: Record<Seccion, string> = {
  tor: "Torneo",
  ind: "Indumentaria",
};

export function BotonOjo() {
  const { modoCliente, toggle } = useModoCliente();
  const Icon = modoCliente ? EyeOff : Eye;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={modoCliente ? "Salir del modo cliente" : "Activar modo cliente"}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
        modoCliente ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

// Texto sobre el titulo: al tocarlo alterna entre Torneo e Indumentaria.
export function EyebrowSeccion({ seccion }: { seccion: Seccion }) {
  const router = useRouter();
  const otra: Seccion = seccion === "tor" ? "ind" : "tor";
  return (
    <button
      type="button"
      onClick={() => router.push(RUTA_INICIO_SECCION[otra])}
      className="flex h-7 items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.6px] text-primary"
    >
      {NOMBRE_SECCION[seccion]}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );
}

export function MobileHeader({
  seccion,
  title,
  pill,
}: {
  seccion: Seccion;
  title: string;
  pill?: React.ReactNode;
}) {
  return (
    <div className="md:hidden mb-3 flex items-end justify-between gap-2">
      <div className="min-w-0">
        <EyebrowSeccion seccion={seccion} />
        <h1 className="whitespace-nowrap text-[22px] font-bold tracking-tight">{title}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {pill}
        <BotonOjo />
      </div>
    </div>
  );
}

// Pill "Octubre 2026 ▾": abre una hoja para elegir torneo.
export function TorneoPill({
  torneos,
  torneoId,
  onSelect,
}: {
  torneos: TorneoConResumen[];
  torneoId: string | undefined;
  onSelect: (id: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const actual = torneos.find((t) => t.id === torneoId);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex h-9 items-center gap-1.5 rounded-full bg-muted px-3 text-[13px] font-semibold"
      >
        {actual ? nombreTorneo(actual.mes, actual.anio) : "Torneo"}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      <BottomSheet open={abierto} onOpenChange={setAbierto} title="Elegir torneo">
        <div className="space-y-1.5">
          {torneos.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                onSelect(t.id);
                setAbierto(false);
              }}
              className={cn(
                "flex min-h-14 w-full items-center justify-between rounded-xl px-4 text-left text-[15px] font-semibold",
                t.id === torneoId ? "bg-[hsl(209_65%_95%)] ring-2 ring-primary" : "bg-muted/60"
              )}
            >
              {nombreTorneo(t.mes, t.anio)}
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}
