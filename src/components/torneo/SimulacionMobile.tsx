"use client";

import { useState } from "react";
import { AlertTriangle, FlaskConical, Minus, Plus, RotateCcw } from "lucide-react";
import { ModalResponsivo } from "@/components/shared/ModalResponsivo";
import { useReportarCambios } from "@/components/shared/CierreProtegido";
import { EtiquetaSeccion, SwitchGrande } from "@/components/mobile/ui";
import { btnPeligro, btnPrimario, campo } from "@/components/premios/estilos";
import { formatearMoneda } from "@/lib/calculations";
import { colorHorario } from "@/lib/torneo";
import { cn } from "@/lib/utils";
import { esSimulacionVacia, type CostoSimulado, type HorarioSimulado } from "@/lib/simulacionTorneo";
import type { GastoTorneo, HorarioConCupo, InscripcionConHorario, TorneoConResumen } from "@/lib/types";
import {
  ConteoMedios,
  Diferencia,
  TextoGuardado,
  aEntero,
  accionesSimulacion,
  useResultadoSimulacion,
  type SimulacionHook,
} from "./SimulacionResumen";

const BORDE_SIM = "border-2 border-dashed border-amber-500/60";

function StepperGrande({ valor, onChange, etiqueta }: { valor: number; onChange: (n: number) => void; etiqueta: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(valor - 1)}
        disabled={valor === 0}
        aria-label={`Quitar ${etiqueta}`}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-muted disabled:opacity-40"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-8 text-center text-[17px] font-bold">{valor}</span>
      <button
        type="button"
        onClick={() => onChange(valor + 1)}
        aria-label={`Sumar ${etiqueta}`}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-muted"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function FormHorarioSimulado({
  horario,
  onGuardar,
  onQuitar,
  onCerrar,
}: {
  horario: HorarioSimulado | null;
  onGuardar: (h: Omit<HorarioSimulado, "id">) => void;
  onQuitar: () => void;
  onCerrar: () => void;
}) {
  const [hora, setHora] = useState(horario?.hora ?? "");
  const [etiqueta, setEtiqueta] = useState(horario?.etiqueta ?? "");
  const [cupo, setCupo] = useState(horario?.cupo?.toString() ?? "");
  const [personas, setPersonas] = useState(horario?.personas.toString() ?? "");

  useReportarCambios(
    hora !== (horario?.hora ?? "") ||
      etiqueta !== (horario?.etiqueta ?? "") ||
      cupo !== (horario?.cupo?.toString() ?? "") ||
      personas !== (horario?.personas.toString() ?? "")
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onGuardar({
          hora: hora.trim(),
          etiqueta: etiqueta.trim(),
          cupo: cupo ? Math.max(1, aEntero(cupo)) : null,
          personas: aEntero(personas),
        });
        onCerrar();
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <EtiquetaSeccion>Hora</EtiquetaSeccion>
          <input className={campo} placeholder="12:00" value={hora} onChange={(e) => setHora(e.target.value)} />
        </div>
        <div>
          <EtiquetaSeccion>Cupo (opcional)</EtiquetaSeccion>
          <input className={campo} type="number" inputMode="numeric" min="1" value={cupo} onChange={(e) => setCupo(e.target.value)} />
        </div>
      </div>
      <div>
        <EtiquetaSeccion>Grupo (opcional)</EtiquetaSeccion>
        <input className={campo} placeholder="Ej: 1° a 7° grado" value={etiqueta} onChange={(e) => setEtiqueta(e.target.value)} />
      </div>
      <div>
        <EtiquetaSeccion>Personas</EtiquetaSeccion>
        <input className={campo} type="number" inputMode="numeric" min="0" value={personas} onChange={(e) => setPersonas(e.target.value)} />
      </div>
      <div className="flex gap-2">
        {horario && (
          <button
            type="button"
            className={btnPeligro}
            onClick={() => {
              onQuitar();
              onCerrar();
            }}
          >
            Quitar
          </button>
        )}
        <button type="submit" className={btnPrimario}>
          {horario ? "Guardar" : "Agregar"}
        </button>
      </div>
    </form>
  );
}

function FormCostoSimulado({
  costo,
  onGuardar,
  onQuitar,
  onCerrar,
}: {
  costo: CostoSimulado | null;
  onGuardar: (c: Omit<CostoSimulado, "id">) => void;
  onQuitar: () => void;
  onCerrar: () => void;
}) {
  const [concepto, setConcepto] = useState(costo?.concepto ?? "");
  const [monto, setMonto] = useState(costo?.monto.toString() ?? "");

  useReportarCambios(concepto !== (costo?.concepto ?? "") || monto !== (costo?.monto.toString() ?? ""));

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!concepto.trim() || !monto) return;
        onGuardar({ concepto: concepto.trim(), monto: aEntero(monto) });
        onCerrar();
      }}
    >
      <div>
        <EtiquetaSeccion>Concepto</EtiquetaSeccion>
        <input className={campo} placeholder="Ej: Árbitro extra" value={concepto} onChange={(e) => setConcepto(e.target.value)} />
      </div>
      <div>
        <EtiquetaSeccion>Monto ($)</EtiquetaSeccion>
        <input className={campo} type="number" inputMode="numeric" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} />
      </div>
      <div className="flex gap-2">
        {costo && (
          <button
            type="button"
            className={btnPeligro}
            onClick={() => {
              onQuitar();
              onCerrar();
            }}
          >
            Quitar
          </button>
        )}
        <button type="submit" className={btnPrimario} disabled={!concepto.trim() || !monto}>
          {costo ? "Guardar" : "Agregar"}
        </button>
      </div>
    </form>
  );
}

type Modal = { tipo: "horario"; id: string | null } | { tipo: "costo"; id: string | null } | null;

// Resumen de Torneo en modo simulacion (mobile).
export function SimulacionMobile({
  torneo,
  horarios,
  inscripciones,
  gastos,
  simulacion,
}: {
  torneo: TorneoConResumen | null;
  horarios: HorarioConCupo[];
  inscripciones: InscripcionConHorario[];
  gastos: GastoTorneo[];
  simulacion: SimulacionHook;
}) {
  const { sim, estado, cargada, actualizar, reiniciar } = simulacion;
  const r = useResultadoSimulacion(torneo, horarios, inscripciones, gastos, sim);
  const acc = accionesSimulacion(actualizar);
  const [modal, setModal] = useState<Modal>(null);
  const [confirmarReinicio, setConfirmarReinicio] = useState(false);

  if (!cargada) return <p className="py-6 text-center text-sm text-muted-foreground">Cargando simulación...</p>;

  const horarioEditado = modal?.tipo === "horario" && modal.id ? sim.horarios.find((h) => h.id === modal.id) ?? null : null;
  const costoEditado = modal?.tipo === "costo" && modal.id ? sim.costos.find((c) => c.id === modal.id) ?? null : null;

  return (
    <div>
      <div className={cn("mb-3 flex items-center justify-between gap-2 rounded-xl bg-amber-500/5 px-3 py-2", BORDE_SIM)}>
        <div className="flex items-center gap-1.5 text-[13px] font-semibold">
          <FlaskConical className="h-4 w-4 text-amber-600" />
          No afecta los datos reales
        </div>
        <TextoGuardado estado={estado} />
      </div>

      <div className={cn("rounded-[18px] bg-amber-500/10 p-4", BORDE_SIM)}>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {r.ganancia >= 0 ? "Ganancia esperada" : "Pérdida esperada"}
        </div>
        <div className="text-[30px] font-bold leading-tight">{formatearMoneda(Math.abs(r.ganancia))}</div>
        <Diferencia valor={r.ganancia - r.gananciaReal} className="text-xs font-semibold" />
        <div className="mt-3 flex gap-2">
          <div className="flex-1 rounded-xl bg-background/70 px-3 py-2">
            <div className="text-[11px] text-muted-foreground">Ingresos</div>
            <div className="text-base font-bold">{formatearMoneda(r.ingreso)}</div>
            <Diferencia valor={r.ingreso - r.ingresoReal} className="text-[11px]" />
          </div>
          <div className="flex-1 rounded-xl bg-background/70 px-3 py-2">
            <div className="text-[11px] text-muted-foreground">Costos</div>
            <div className="text-base font-bold">{formatearMoneda(r.costos)}</div>
            <Diferencia valor={r.costos - r.costosReales} invertido className="text-[11px]" />
          </div>
        </div>
      </div>

      <div className="mt-5">
        <EtiquetaSeccion>Supuestos</EtiquetaSeccion>
        <div className="space-y-3 rounded-[14px] border p-3.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[15px] font-medium">Todos los anotados pagan</span>
            <SwitchGrande checked={sim.todosPagan} onChange={() => acc.setTodosPagan(!sim.todosPagan)} label="Todos los anotados pagan" />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-[13px]">
              <span className="text-muted-foreground">Pagan en efectivo</span>
              <span className="font-semibold">{sim.pctEfectivo}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={sim.pctEfectivo}
              onChange={(e) => acc.setPctEfectivo(parseInt(e.target.value))}
              className="h-8 w-full accent-primary"
              aria-label="Porcentaje que paga en efectivo"
            />
            <div className="text-xs text-muted-foreground">
              Precio esperado por persona: <span className="font-semibold text-foreground">{formatearMoneda(r.precioPorPersona)}</span>
            </div>
          </div>
          <ConteoMedios medios={r.medios} className="border-t pt-3 text-[13px]" />
        </div>
      </div>

      <div className="mt-5">
        <EtiquetaSeccion>Gente por horario</EtiquetaSeccion>
        <div className="space-y-2.5">
          {r.filas.map((f) => (
            <div
              key={f.id}
              className={cn(
                "rounded-[14px] p-3.5",
                f.simulado ? cn("bg-amber-500/5", BORDE_SIM) : colorHorario(f.orden).kpi
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  disabled={!f.simulado}
                  onClick={() => setModal({ tipo: "horario", id: f.id })}
                  className="min-w-0 text-left"
                >
                  <div className="text-[15px] font-bold">
                    {f.hora || "Sin hora"}
                    {f.nombre && <span className="font-medium text-muted-foreground"> · {f.nombre}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {f.simulado ? "Simulado · tocá para editar" : `${f.reales} inscriptos · ${f.pagaron} pagaron`}
                  </div>
                </button>
                <StepperGrande
                  valor={f.extra}
                  etiqueta={`gente en ${f.hora || "el horario simulado"}`}
                  onChange={(n) => (f.simulado ? acc.editarHorario(f.id, { personas: Math.max(0, n) }) : acc.setExtra(f.id, n))}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[13px]">
                <span className={cn("inline-flex items-center gap-1 font-semibold", f.excedeCupo && "text-destructive")}>
                  {f.excedeCupo && <AlertTriangle className="h-3.5 w-3.5" />}
                  Total {f.total}
                  {f.cupo != null && ` / ${f.cupo}`}
                </span>
                <span className="font-semibold">{formatearMoneda(f.ingreso)}</span>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setModal({ tipo: "horario", id: null })}
          className="mt-2.5 flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed text-[15px] font-semibold text-muted-foreground"
        >
          <Plus className="h-4 w-4" />
          Agregar horario simulado
        </button>
      </div>

      <div className="mt-5">
        <EtiquetaSeccion>Costos</EtiquetaSeccion>
        <div className="overflow-hidden rounded-[14px] border">
          {gastos.map((g) => (
            <div key={g.id} className="flex min-h-12 items-center justify-between gap-3 border-b px-4 text-muted-foreground">
              <span className="min-w-0 truncate text-[15px]">{g.concepto}</span>
              <span className="shrink-0 text-[15px]">{formatearMoneda(g.monto)}</span>
            </div>
          ))}
          {sim.costos.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setModal({ tipo: "costo", id: c.id })}
              className="flex min-h-12 w-full items-center justify-between gap-3 border-b bg-amber-500/5 px-4 text-left"
            >
              <span className="min-w-0 truncate text-[15px] font-medium italic">
                {c.concepto} <span className="text-xs font-normal not-italic text-amber-700">· simulado</span>
              </span>
              <span className="shrink-0 text-[15px] font-semibold italic">{formatearMoneda(c.monto)}</span>
            </button>
          ))}
          <div className="flex min-h-12 items-center justify-between gap-3 bg-muted/60 px-4 font-bold">
            <span className="text-[15px]">Total</span>
            <span className="text-[15px]">{formatearMoneda(r.costos)}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setModal({ tipo: "costo", id: null })}
          className="mt-2.5 flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed text-[15px] font-semibold text-muted-foreground"
        >
          <Plus className="h-4 w-4" />
          Agregar costo simulado
        </button>
      </div>

      {!esSimulacionVacia(sim) &&
        (confirmarReinicio ? (
          <button
            type="button"
            onClick={() => {
              reiniciar();
              setConfirmarReinicio(false);
            }}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[hsl(0_70%_48%)] text-[15px] font-semibold text-white"
          >
            Confirmar: borrar toda la simulación
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmarReinicio(true)}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl border text-[15px] font-semibold"
          >
            <RotateCcw className="h-4 w-4" />
            Reiniciar simulación
          </button>
        ))}

      <ModalResponsivo
        open={modal?.tipo === "horario"}
        onOpenChange={(o) => !o && setModal(null)}
        title={horarioEditado ? "Editar horario simulado" : "Nuevo horario simulado"}
      >
        {modal?.tipo === "horario" && (
          <FormHorarioSimulado
            key={modal.id ?? "nuevo"}
            horario={horarioEditado}
            onGuardar={(h) => (horarioEditado ? acc.editarHorario(horarioEditado.id, h) : acc.agregarHorario(h))}
            onQuitar={() => horarioEditado && acc.quitarHorario(horarioEditado.id)}
            onCerrar={() => setModal(null)}
          />
        )}
      </ModalResponsivo>
      <ModalResponsivo
        open={modal?.tipo === "costo"}
        onOpenChange={(o) => !o && setModal(null)}
        title={costoEditado ? "Editar costo simulado" : "Nuevo costo simulado"}
      >
        {modal?.tipo === "costo" && (
          <FormCostoSimulado
            key={modal.id ?? "nuevo"}
            costo={costoEditado}
            onGuardar={(c) => (costoEditado ? acc.editarCosto(costoEditado.id, c) : acc.agregarCosto(c))}
            onQuitar={() => costoEditado && acc.quitarCosto(costoEditado.id)}
            onCerrar={() => setModal(null)}
          />
        )}
      </ModalResponsivo>
    </div>
  );
}
