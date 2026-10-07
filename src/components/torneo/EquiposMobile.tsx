"use client";

import { useMemo, useState } from "react";
import { RotateCcw, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { colorHorario } from "@/lib/torneo";
import { calcularFormacion } from "@/lib/formacion";
import {
  EQUIPOS,
  EQUIPO_MOBILE,
  agruparPorEquipo,
  nombreCorto,
  type Equipo,
  type PestanaEquipo,
} from "@/lib/equiposMobile";
import type { HorarioConCupo, InscripcionConHorario, TorneoConResumen } from "@/lib/types";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { MobileHeader, TorneoPill } from "@/components/mobile/MobileHeader";
import { useToast } from "@/components/mobile/ToastUndo";
import { Chip, Segmented } from "@/components/mobile/ui";

export type EstadoEquipo = {
  id: string;
  equipo: Equipo | null;
  equipoAsignadoAt: InscripcionConHorario["equipoAsignadoAt"];
};

const DOT_SIN_ASIGNAR = "hsl(220 15% 60%)";

function datosPestana(p: PestanaEquipo) {
  return p === "SIN"
    ? { nombre: "Sin asignar", corto: "Sin asignar", bg: DOT_SIN_ASIGNAR, fg: "#ffffff" }
    : EQUIPO_MOBILE[p];
}

function Pago({ pago }: { pago: boolean }) {
  return (
    <span className={cn("font-medium", pago ? "text-[hsl(152_55%_28%)]" : "text-[hsl(25_75%_35%)]")}>
      {pago ? "Pagó" : "Sin pagar"}
    </span>
  );
}

function HojaMover({
  inscripcion,
  abierta,
  onOpenChange,
  onElegir,
}: {
  inscripcion: InscripcionConHorario | null;
  abierta: boolean;
  onOpenChange: (v: boolean) => void;
  onElegir: (equipo: Equipo | null) => void;
}) {
  const opciones: { valor: Equipo | null; titulo: string; color: string }[] = [
    ...EQUIPOS.map((e) => ({ valor: e as Equipo | null, titulo: EQUIPO_MOBILE[e].nombre, color: EQUIPO_MOBILE[e].bg })),
    { valor: null, titulo: "Sin asignar", color: DOT_SIN_ASIGNAR },
  ];
  return (
    <BottomSheet open={abierta} onOpenChange={onOpenChange} title={inscripcion ? `Mover a ${nombreCorto(inscripcion.nombre)}` : "Mover"}>
      <div className="space-y-2">
        {opciones.map((o) => {
          const actual = (inscripcion?.equipo ?? null) === o.valor;
          return (
            <button
              key={o.titulo}
              type="button"
              disabled={actual}
              onClick={() => onElegir(o.valor)}
              className={cn(
                "flex min-h-14 w-full items-center gap-3 rounded-xl border px-4 text-left text-[15px] font-semibold",
                actual && "opacity-40"
              )}
            >
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: o.color }} />
              {o.titulo}
              {actual && <span className="ml-auto text-xs font-medium text-muted-foreground">Actual</span>}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}

function Cancha({
  equipo,
  jugadores,
  onFicha,
}: {
  equipo: Equipo;
  jugadores: InscripcionConHorario[];
  onFicha: (i: InscripcionConHorario) => void;
}) {
  const cfg = EQUIPO_MOBILE[equipo];
  const formacion = useMemo(() => calcularFormacion(jugadores), [jugadores]);
  return (
    <div className="relative h-[400px] overflow-hidden rounded-xl border-2 border-green-800 bg-gradient-to-b from-green-600 to-green-700">
      <div className="absolute inset-x-0 top-1/2 h-px bg-white/40" />
      <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40" />
      <div className="absolute inset-x-[25%] bottom-0 h-10 rounded-t-sm border-2 border-b-0 border-white/40" />
      {formacion.map((p) => (
        <button
          key={p.jugador.id}
          type="button"
          onClick={() => onFicha(p.jugador)}
          className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5"
          style={{ left: `${p.xPct}%`, top: `${p.yPct}%` }}
        >
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-[15px] font-bold shadow-md"
            style={{ backgroundColor: cfg.bg, color: cfg.fg }}
          >
            {p.numero}
          </span>
          <span className="max-w-[88px] truncate rounded bg-black/50 px-1 text-[10.5px] font-medium text-white">
            {nombreCorto(p.jugador.nombre)}
          </span>
        </button>
      ))}
    </div>
  );
}

export function EquiposMobile({
  torneos,
  torneoId,
  seleccionarTorneo,
  horarios,
  horarioId,
  setHorarioId,
  inscripciones,
  loading,
  puedeDeshacer,
  onDeshacer,
  onMover,
  onRestaurar,
  onReiniciar,
  onRestaurarVarios,
}: {
  torneos: TorneoConResumen[];
  torneoId: string | undefined;
  seleccionarTorneo: (id: string) => void;
  horarios: HorarioConCupo[];
  horarioId: string;
  setHorarioId: (id: string) => void;
  inscripciones: InscripcionConHorario[];
  loading: boolean;
  puedeDeshacer: boolean;
  onDeshacer: () => void;
  onMover: (id: string, equipo: Equipo | null) => Promise<boolean>;
  onRestaurar: (previo: EstadoEquipo) => Promise<void>;
  onReiniciar: () => Promise<EstadoEquipo[]>;
  onRestaurarVarios: (previos: EstadoEquipo[]) => Promise<void>;
}) {
  const toast = useToast();
  const [pestana, setPestana] = useState<PestanaEquipo>("SIN");
  const [vista, setVista] = useState<"lista" | "cancha">("lista");
  const [moverId, setMoverId] = useState<string | null>(null);
  const [moverAbierta, setMoverAbierta] = useState(false);
  const [reiniciarAbierto, setReiniciarAbierto] = useState(false);

  const delHorario = useMemo(
    () => inscripciones.filter((i) => i.horarioId === horarioId),
    [inscripciones, horarioId]
  );
  const grupos = useMemo(() => agruparPorEquipo(delHorario), [delHorario]);
  const hayAsignados = delHorario.some((i) => i.equipo);
  const aMover = inscripciones.find((i) => i.id === moverId) ?? null;

  const abrirMover = (i: InscripcionConHorario) => {
    setMoverId(i.id);
    setMoverAbierta(true);
  };

  const asignar = async (i: InscripcionConHorario, equipo: Equipo | null) => {
    const previo: EstadoEquipo = { id: i.id, equipo: i.equipo, equipoAsignadoAt: i.equipoAsignadoAt };
    if (!(await onMover(i.id, equipo))) return toast("No se pudo mover");
    toast(`${nombreCorto(i.nombre)} → ${equipo ? EQUIPO_MOBILE[equipo].nombre : "Sin asignar"}`, () => onRestaurar(previo));
  };

  const reiniciar = async () => {
    setReiniciarAbierto(false);
    const previos = await onReiniciar();
    if (previos.length === 0) return;
    toast(`${previos.length} jugadores sin equipo`, () => onRestaurarVarios(previos));
  };

  const pestanas: PestanaEquipo[] = ["SIN", ...EQUIPOS];
  const lista = grupos[pestana];

  const btnAccion =
    "flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold disabled:opacity-40";

  return (
    <div>
      <MobileHeader
        seccion="tor"
        title="Equipos"
        pill={<TorneoPill torneos={torneos} torneoId={torneoId} onSelect={seleccionarTorneo} />}
      />

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Cargando...</p>
      ) : !horarioId ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No hay horarios cargados</p>
      ) : (
        <>
          <div className="sticky top-0 z-10 -mx-4 border-b bg-background px-4 pb-2.5 pt-1">
            <div className="-mx-4 mb-2 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
              {horarios.map((h) => (
                <Chip key={h.id} active={horarioId === h.id} color={colorHorario(h.orden).hex} onClick={() => setHorarioId(h.id)}>
                  {h.hora} · {h.grupoEdad.nombre}
                </Chip>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {pestanas.map((p) => {
                const d = datosPestana(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPestana(p)}
                    className={cn(
                      "flex min-h-16 flex-col items-center justify-center gap-[3px] rounded-xl px-0.5 py-2",
                      pestana === p ? "bg-[hsl(209_65%_93%)] ring-2 ring-primary" : "bg-[hsl(210_30%_96%)]"
                    )}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.bg }} />
                    <span className="text-[11px] font-semibold">{d.corto}</span>
                    <span className="text-[18px] font-bold leading-none">{grupos[p].length}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="my-3 flex gap-2">
            <button type="button" className={btnAccion} onClick={onDeshacer} disabled={!puedeDeshacer}>
              <Undo2 className="h-4 w-4" />
              Deshacer
            </button>
            <button type="button" className={btnAccion} onClick={() => setReiniciarAbierto(true)} disabled={!hayAsignados}>
              <RotateCcw className="h-4 w-4" />
              Reiniciar todo
            </button>
          </div>

          {pestana === "SIN" ? (
            <>
              <div className="mb-3 space-y-2 rounded-[14px] border bg-[hsl(210_30%_98%)] p-3">
                {EQUIPOS.map((e) => (
                  <div key={e} className="flex items-start gap-2">
                    <span className="w-16 shrink-0 pt-1 text-xs font-bold uppercase" style={{ color: e === "AMARILLO" ? "#a16207" : EQUIPO_MOBILE[e].bg }}>
                      {EQUIPO_MOBILE[e].nombre}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {grupos[e].length === 0 ? (
                        <span className="pt-1 text-xs text-muted-foreground">Vacío</span>
                      ) : (
                        grupos[e].map((i) => (
                          <button
                            key={i.id}
                            type="button"
                            onClick={() => abrirMover(i)}
                            className="h-7 rounded-full px-2.5 text-xs font-semibold"
                            style={{ backgroundColor: EQUIPO_MOBILE[e].bg, color: EQUIPO_MOBILE[e].fg }}
                          >
                            {nombreCorto(i.nombre)}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mb-2 text-xs text-muted-foreground">Tocá R, A o N para asignar el equipo.</p>
              {lista.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">Todos tienen equipo asignado</p>
              )}
              <div className="divide-y">
                {lista.map((i) => (
                  <div key={i.id} className="flex items-center gap-3 py-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[hsl(210_30%_94%)] text-sm font-bold text-[hsl(226_40%_35%)]">
                      {i.nombre[0]?.toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-semibold">{i.nombre}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {i.edad ? `${i.edad} · ` : ""}
                        <Pago pago={i.pago} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {EQUIPOS.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => asignar(i, e)}
                          aria-label={`Asignar a ${EQUIPO_MOBILE[e].nombre}`}
                          className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold"
                          style={{ backgroundColor: EQUIPO_MOBILE[e].bg, color: EQUIPO_MOBILE[e].fg }}
                        >
                          {EQUIPO_MOBILE[e].nombre[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="mb-3">
                <Segmented
                  value={vista}
                  onChange={setVista}
                  options={[
                    { value: "lista", label: "Lista" },
                    { value: "cancha", label: "Cancha" },
                  ]}
                />
              </div>
              {lista.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Nadie en este equipo todavía</p>
              ) : vista === "lista" ? (
                <div className="divide-y">
                  {lista.map((i, k) => (
                    <div key={i.id} className="flex items-center gap-3 py-2.5">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                        style={{ backgroundColor: EQUIPO_MOBILE[pestana].bg, color: EQUIPO_MOBILE[pestana].fg }}
                      >
                        {k + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-semibold">{i.nombre}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {i.edad ? `${i.edad} · ` : ""}
                          <Pago pago={i.pago} />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => abrirMover(i)}
                        className="h-11 shrink-0 rounded-xl border px-3.5 text-sm font-semibold"
                      >
                        Mover →
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <Cancha equipo={pestana} jugadores={lista} onFicha={abrirMover} />
              )}
            </>
          )}
        </>
      )}

      <HojaMover
        inscripcion={aMover}
        abierta={moverAbierta}
        onOpenChange={setMoverAbierta}
        onElegir={(equipo) => {
          setMoverAbierta(false);
          if (aMover) asignar(aMover, equipo);
        }}
      />

      <BottomSheet open={reiniciarAbierto} onOpenChange={setReiniciarAbierto} title="¿Reiniciar equipos?">
        <p className="mb-4 text-sm text-muted-foreground">
          Se quita a los {delHorario.filter((i) => i.equipo).length} jugadores de sus equipos en este horario. Podés deshacerlo
          desde el aviso que aparece después.
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setReiniciarAbierto(false)} className="h-12 flex-1 rounded-xl border text-[15px] font-semibold">
            Cancelar
          </button>
          <button type="button" onClick={reiniciar} className="h-12 flex-1 rounded-xl bg-[hsl(0_70%_48%)] text-[15px] font-semibold text-white">
            Reiniciar todo
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
