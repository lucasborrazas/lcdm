"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardList, Plus, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatearMoneda } from "@/lib/calculations";
import { ESTADOS_TORNEO, labelEstadoTorneo, nombreTorneo } from "@/lib/torneo";
import type { TorneoConResumen } from "@/lib/types";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { Segmented } from "@/components/mobile/ui";
import { NuevoTorneoSheet } from "./NuevoTorneoSheet";

export function HistorialMobile({
  torneos,
  loading,
  onEstado,
  onCreado,
}: {
  torneos: TorneoConResumen[];
  loading: boolean;
  onEstado: (id: string, estado: string) => void;
  onCreado: () => void;
}) {
  const [elegido, setElegido] = useState<string | null>(null);
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  // por defecto queda resaltado el mas reciente
  const seleccionado = elegido ?? torneos[0]?.id;

  const accion =
    "flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border text-[13px] font-semibold";

  return (
    <div>
      <MobileHeader seccion="tor" title="Historial" />

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Cargando...</p>
      ) : (
        <div className="space-y-2.5 pb-4">
          {torneos.map((t) => {
            const activo = t.id === seleccionado;
            return (
              <div
                key={t.id}
                className={cn(
                  "rounded-[14px] border p-3.5",
                  activo && "bg-[hsl(209_65%_95%)] ring-2 ring-primary"
                )}
              >
                <button type="button" onClick={() => setElegido(t.id)} className="w-full text-left">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-bold">{nombreTorneo(t.mes, t.anio)}</span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        t.estado === "FINALIZADO" ? "border text-muted-foreground" : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      {labelEstadoTorneo(t.estado)}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-6 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Inscriptos</div>
                      <div className="font-semibold">{t.cantidadInscriptos}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Recaudado</div>
                      <div className="font-semibold">{formatearMoneda(t.recaudado)}</div>
                    </div>
                  </div>
                </button>

                {activo && (
                  <div className="mt-3 space-y-3 border-t pt-3">
                    <div className="flex gap-6 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">Gastos</div>
                        <div className="font-semibold">{formatearMoneda(t.totalGastos)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Resultado</div>
                        <div className={cn("font-semibold", t.ganancia >= 0 ? "text-[hsl(152_55%_28%)]" : "text-destructive")}>
                          {t.ganancia >= 0 ? "+" : "-"}
                          {formatearMoneda(Math.abs(t.ganancia))}
                        </div>
                      </div>
                    </div>
                    <Segmented
                      value={t.estado}
                      onChange={(estado) => onEstado(t.id, estado)}
                      options={ESTADOS_TORNEO.map((e) => ({ value: e.value, label: e.label }))}
                    />
                    <div className="flex gap-2">
                      <Link href={`/torneo/inscripciones?torneoId=${t.id}`} className={accion}>
                        <ClipboardList className="h-4 w-4" />
                        Inscrip.
                      </Link>
                      <Link href={`/torneo/equipos?torneoId=${t.id}`} className={accion}>
                        <Users className="h-4 w-4" />
                        Equipos
                      </Link>
                      <Link href={`/torneo/resumen?torneoId=${t.id}`} className={accion}>
                        <Wallet className="h-4 w-4" />
                        Resumen
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => setNuevoAbierto(true)}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-[14px] border-2 border-dashed text-[15px] font-semibold text-muted-foreground"
          >
            <Plus className="h-5 w-5" />
            Nuevo torneo
          </button>
        </div>
      )}

      <NuevoTorneoSheet
        open={nuevoAbierto}
        onOpenChange={setNuevoAbierto}
        torneos={torneos}
        onCreated={onCreado}
      />
    </div>
  );
}
