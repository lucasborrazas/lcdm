"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatearMoneda } from "@/lib/calculations";
import { colorHorario } from "@/lib/torneo";
import type { GastoTorneo, HorarioConCupo, InscripcionConHorario, TorneoConResumen } from "@/lib/types";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { MobileHeader, TorneoPill } from "@/components/mobile/MobileHeader";
import { useToast } from "@/components/mobile/ToastUndo";
import { EtiquetaSeccion } from "@/components/mobile/ui";
import { NuevoTorneoSheet } from "./NuevoTorneoSheet";
import { useReportarCambios } from "@/components/shared/CierreProtegido";

const campo = "h-12 w-full rounded-xl bg-muted px-3 text-[15px] outline-none";

function FormCosto({
  torneoId,
  gasto,
  onCerrar,
  onActualizar,
}: {
  torneoId: string | undefined;
  gasto: GastoTorneo | null;
  onCerrar: () => void;
  onActualizar: () => Promise<void>;
}) {
  const toast = useToast();
  const [concepto, setConcepto] = useState(gasto?.concepto ?? "");
  const [monto, setMonto] = useState(gasto?.monto.toString() ?? "");
  const [confirmar, setConfirmar] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useReportarCambios(concepto !== (gasto?.concepto ?? "") || monto !== (gasto?.monto.toString() ?? ""));

  const guardar = async () => {
    setGuardando(true);
    try {
      const res = gasto
        ? await fetch(`/api/torneo/gastos/${gasto.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ concepto, monto: parseInt(monto) || 0 }),
          })
        : await fetch("/api/torneo/gastos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ torneoId, concepto, monto: parseInt(monto) || 0 }),
          });
      if (!res.ok) throw new Error();
    } catch {
      setGuardando(false);
      return toast("No se pudo guardar el costo");
    }
    setGuardando(false);
    await onActualizar();
    onCerrar();
    toast(gasto ? "Costo actualizado" : "Costo agregado");
  };

  const eliminar = async () => {
    if (!gasto) return;
    try {
      const res = await fetch(`/api/torneo/gastos/${gasto.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      return toast("No se pudo eliminar el costo");
    }
    await onActualizar();
    onCerrar();
    toast("Costo eliminado");
  };

  return (
    <div className="space-y-4">
      <div>
        <EtiquetaSeccion>Concepto</EtiquetaSeccion>
        <input className={campo} placeholder="Ej: Cancha" value={concepto} onChange={(e) => setConcepto(e.target.value)} />
      </div>
      <div>
        <EtiquetaSeccion>Monto ($)</EtiquetaSeccion>
        <input className={campo} type="number" inputMode="numeric" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} />
      </div>
      <div className="flex gap-2">
        {gasto &&
          (confirmar ? (
            <button type="button" onClick={eliminar} className="h-12 flex-1 rounded-xl bg-[hsl(0_70%_48%)] text-[15px] font-semibold text-white">
              Confirmar eliminar
            </button>
          ) : (
            <button type="button" onClick={() => setConfirmar(true)} className="h-12 flex-1 rounded-xl border border-[hsl(0_70%_48%)] text-[15px] font-semibold text-[hsl(0_70%_48%)]">
              Eliminar
            </button>
          ))}
        <button
          type="button"
          onClick={guardar}
          disabled={!concepto.trim() || !monto || guardando}
          className="h-12 flex-1 rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground disabled:opacity-50"
        >
          {gasto ? "Guardar" : "Agregar"}
        </button>
      </div>
    </div>
  );
}

export function ResumenMobile({
  torneos,
  torneoId,
  torneoActual,
  seleccionarTorneo,
  gastos,
  horarios,
  inscripciones,
  loading,
  onActualizar,
  onTorneoCreado,
}: {
  torneos: TorneoConResumen[];
  torneoId: string | undefined;
  torneoActual: TorneoConResumen | null;
  seleccionarTorneo: (id: string) => void;
  gastos: GastoTorneo[];
  horarios: HorarioConCupo[];
  inscripciones: InscripcionConHorario[];
  loading: boolean;
  onActualizar: () => Promise<void>;
  onTorneoCreado: (id: string) => void;
}) {
  const [costoAbierto, setCostoAbierto] = useState(false);
  const [costoId, setCostoId] = useState<string | null>(null);
  const [nuevoTorneoAbierto, setNuevoTorneoAbierto] = useState(false);

  const totalCostos = gastos.reduce((s, g) => s + g.monto, 0);
  const recaudado = torneoActual?.recaudado ?? 0;
  const ganancia = recaudado - totalCostos;
  const gasto = gastos.find((g) => g.id === costoId) ?? null;

  const abrirCosto = (id: string | null) => {
    setCostoId(id);
    setCostoAbierto(true);
  };

  return (
    <div>
      <MobileHeader
        seccion="tor"
        title="Resumen"
        pill={<TorneoPill torneos={torneos} torneoId={torneoId} onSelect={seleccionarTorneo} />}
      />

      <div className="rounded-[18px] bg-primary p-4 text-primary-foreground">
        <div className="text-xs font-semibold uppercase tracking-wide opacity-80">
          {ganancia >= 0 ? "Ganancia estimada" : "Pérdida estimada"}
        </div>
        <div className="text-[30px] font-bold leading-tight">{formatearMoneda(Math.abs(ganancia))}</div>
        <div className="mt-3 flex gap-2">
          <div className="flex-1 rounded-xl bg-white/15 px-3 py-2">
            <div className="text-[11px] opacity-80">Recaudado</div>
            <div className="text-base font-bold">{formatearMoneda(recaudado)}</div>
          </div>
          <div className="flex-1 rounded-xl bg-white/15 px-3 py-2">
            <div className="text-[11px] opacity-80">Gastos</div>
            <div className="text-base font-bold">{formatearMoneda(totalCostos)}</div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <EtiquetaSeccion>Cupos por horario</EtiquetaSeccion>
        {loading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Cargando...</p>
        ) : (
          <div className="space-y-2.5">
            {horarios.map((h) => {
              const color = colorHorario(h.orden);
              const delHorario = inscripciones.filter((i) => i.horarioId === h.id);
              const pagaron = delHorario.filter((i) => i.pago).length;
              const conEquipo = delHorario.filter((i) => i.equipo).length;
              const lleno = h.cupoMaximo != null && h.inscriptos >= h.cupoMaximo;
              return (
                <div key={h.id} className={cn("rounded-[14px] p-3.5", color.kpi, lleno && "ring-1 ring-destructive/40")}>
                  <div className="text-xs font-medium text-muted-foreground">
                    {h.hora} — {h.grupoEdad.nombre}
                  </div>
                  <div className={cn("text-[20px] font-bold", lleno && "text-destructive")}>
                    {h.inscriptos}
                    {h.cupoMaximo != null && (
                      <span className="text-sm font-normal text-muted-foreground">/{h.cupoMaximo}</span>
                    )}
                  </div>
                  {h.cupoMaximo != null && (
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/10">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (h.inscriptos / h.cupoMaximo) * 100)}%`,
                          backgroundColor: color.hex,
                        }}
                      />
                    </div>
                  )}
                  <div className="mt-1.5 text-xs text-muted-foreground">
                    {pagaron} pagaron · {conEquipo} con equipo{!h.activo && " · inactivo"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-5">
        <EtiquetaSeccion>Costos del mes</EtiquetaSeccion>
        <div className="overflow-hidden rounded-[14px] border">
          {gastos.length === 0 && !loading && (
            <p className="px-4 py-3 text-sm text-muted-foreground">Sin costos cargados</p>
          )}
          {gastos.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => abrirCosto(g.id)}
              className="flex min-h-12 w-full items-center justify-between gap-3 border-b px-4 text-left last:border-b-0"
            >
              <span className="min-w-0 truncate text-[15px] font-medium">{g.concepto}</span>
              <span className="shrink-0 text-[15px] font-semibold">{formatearMoneda(g.monto)}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => abrirCosto(null)}
          disabled={!torneoId}
          className="mt-2.5 flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed text-[15px] font-semibold text-muted-foreground disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Agregar costo
        </button>
        <button
          type="button"
          onClick={() => setNuevoTorneoAbierto(true)}
          className="mt-2.5 flex h-12 w-full items-center justify-center gap-2 rounded-xl border text-[15px] font-semibold"
        >
          <Plus className="h-4 w-4" />
          Nuevo torneo
        </button>
      </div>

      <BottomSheet open={costoAbierto} onOpenChange={setCostoAbierto} title={gasto ? "Editar costo" : "Nuevo costo"}>
        <FormCosto
          torneoId={torneoId}
          gasto={gasto}
          onCerrar={() => setCostoAbierto(false)}
          onActualizar={onActualizar}
        />
      </BottomSheet>
      <NuevoTorneoSheet
        open={nuevoTorneoAbierto}
        onOpenChange={setNuevoTorneoAbierto}
        torneos={torneos}
        onCreated={onTorneoCreado}
      />
    </div>
  );
}
