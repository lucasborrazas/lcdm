"use client";

import { useState } from "react";
import { NOMBRES_MESES, nombreTorneo } from "@/lib/torneo";
import type { TorneoConResumen } from "@/lib/types";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { EtiquetaSeccion } from "@/components/mobile/ui";
import { proximoMesAnio } from "./NuevoTorneoDialog";

const campo = "h-12 w-full rounded-xl bg-muted px-3 text-[15px] outline-none";

// Reemplaza a NuevoTorneoDialog en mobile.
export function NuevoTorneoSheet({
  open,
  onOpenChange,
  torneos,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  torneos: TorneoConResumen[];
  onCreated: (id: string) => void;
}) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Nuevo torneo">
      <FormNuevoTorneo torneos={torneos} onCerrar={() => onOpenChange(false)} onCreated={onCreated} />
    </BottomSheet>
  );
}

function FormNuevoTorneo({
  torneos,
  onCerrar,
  onCreated,
}: {
  torneos: TorneoConResumen[];
  onCerrar: () => void;
  onCreated: (id: string) => void;
}) {
  const sugerido = proximoMesAnio(torneos);
  const [mes, setMes] = useState(sugerido.mes);
  const [anio, setAnio] = useState(sugerido.anio.toString());
  const [duplicarDesde, setDuplicarDesde] = useState(torneos[0]?.id ?? "ninguno");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const crear = async () => {
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch("/api/torneo/torneos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mes,
          anio: parseInt(anio) || sugerido.anio,
          duplicarDesdeTorneoId: duplicarDesde !== "ninguno" ? duplicarDesde : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "No se pudo crear el torneo");
        setGuardando(false);
        return;
      }
      const data = await res.json();
      onCerrar();
      onCreated(data.id);
    } catch {
      setError("No se pudo crear el torneo");
    }
    setGuardando(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <EtiquetaSeccion>Mes</EtiquetaSeccion>
          <select className={campo} value={mes} onChange={(e) => setMes(parseInt(e.target.value))}>
            {NOMBRES_MESES.map((nombre, i) => (
              <option key={nombre} value={i + 1}>{nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <EtiquetaSeccion>Año</EtiquetaSeccion>
          <input className={campo} type="number" inputMode="numeric" value={anio} onChange={(e) => setAnio(e.target.value)} />
        </div>
      </div>

      {torneos.length > 0 && (
        <div>
          <EtiquetaSeccion>Duplicar horarios de</EtiquetaSeccion>
          <select className={campo} value={duplicarDesde} onChange={(e) => setDuplicarDesde(e.target.value)}>
            <option value="ninguno">No duplicar (empezar vacío)</option>
            {torneos.map((t) => (
              <option key={t.id} value={t.id}>{nombreTorneo(t.mes, t.anio)}</option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="button"
        onClick={crear}
        disabled={guardando}
        className="h-12 w-full rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground disabled:opacity-50"
      >
        {guardando ? "Creando..." : "Crear torneo"}
      </button>
    </div>
  );
}
