"use client";

import { useState } from "react";
import { ModalResponsivo } from "@/components/shared/ModalResponsivo";
import { useReportarCambios } from "@/components/shared/CierreProtegido";
import { EtiquetaSeccion, Chip } from "@/components/mobile/ui";
import type { EntregaConResumen } from "@/lib/types";
import { btnPrimario, campo } from "./estilos";

function proximoAnio(entregas: EntregaConResumen[]): number {
  return entregas.length > 0 ? entregas[0].anio + 1 : new Date().getFullYear();
}

function FormNuevaEntrega({
  entregas,
  onCerrar,
  onCreada,
}: {
  entregas: EntregaConResumen[];
  onCerrar: () => void;
  onCreada: (id: string) => void;
}) {
  const sugerido = proximoAnio(entregas);
  const [anio, setAnio] = useState(sugerido.toString());
  // por defecto copia los turnos de la entrega anterior
  const [duplicarDesde, setDuplicarDesde] = useState<string | null>(entregas[0]?.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useReportarCambios(anio !== sugerido.toString() || duplicarDesde !== (entregas[0]?.id ?? null));

  const crear = async () => {
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch("/api/premios/entregas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anio: parseInt(anio) || sugerido,
          duplicarDesdeEntregaId: duplicarDesde ?? undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(typeof data?.error === "string" ? data.error : "No se pudo crear la entrega");
        setGuardando(false);
        return;
      }
      const data = await res.json();
      onCerrar();
      onCreada(data.id);
    } catch {
      setError("No se pudo crear la entrega");
    }
    setGuardando(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <EtiquetaSeccion>Año</EtiquetaSeccion>
        <input className={campo} type="number" inputMode="numeric" value={anio} onChange={(e) => setAnio(e.target.value)} />
      </div>

      {entregas.length > 0 && (
        <div>
          <EtiquetaSeccion>Copiar turnos y precios de</EtiquetaSeccion>
          <div className="flex flex-wrap gap-2">
            <Chip active={duplicarDesde === null} onClick={() => setDuplicarDesde(null)}>
              Empezar de cero
            </Chip>
            {entregas.map((e) => (
              <Chip key={e.id} active={duplicarDesde === e.id} onClick={() => setDuplicarDesde(e.id)}>
                {e.anio}
              </Chip>
            ))}
          </div>
          {duplicarDesde === null && (
            <p className="mt-2 text-xs text-muted-foreground">
              Se crean los 5 turnos de siempre (16:00 a 18:40) con el precio por defecto del bono.
            </p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button type="button" onClick={crear} disabled={guardando} className={btnPrimario}>
        {guardando ? "Creando..." : "Crear entrega"}
      </button>
    </div>
  );
}

export function NuevaEntregaModal({
  open,
  onOpenChange,
  entregas,
  onCreada,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entregas: EntregaConResumen[];
  onCreada: (id: string) => void;
}) {
  return (
    <ModalResponsivo open={open} onOpenChange={onOpenChange} title="Nueva entrega" className="sm:max-w-sm">
      <FormNuevaEntrega entregas={entregas} onCerrar={() => onOpenChange(false)} onCreada={onCreada} />
    </ModalResponsivo>
  );
}
