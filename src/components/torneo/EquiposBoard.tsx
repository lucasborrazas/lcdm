"use client";

import { useState, useEffect, useMemo, useCallback, type CSSProperties } from "react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Undo2, RotateCcw } from "lucide-react";
import { TorneoSwitcher } from "./TorneoSwitcher";
import { EstadoTorneoBadge } from "./EstadoTorneoBadge";
import { useTorneoActual } from "./useTorneoActual";
import { calcularFormacion, type JugadorEnCancha } from "@/lib/formacion";
import { cn } from "@/lib/utils";
import type { HorarioConCupo, InscripcionConHorario } from "@/lib/types";

type Equipo = "ROJO" | "AMARILLO" | "NARANJA";

const EQUIPOS: Equipo[] = ["ROJO", "AMARILLO", "NARANJA"];

const EQUIPO_CONFIG: Record<Equipo, { titulo: string; circulo: string; header: string }> = {
  ROJO: { titulo: "Rojo", circulo: "bg-red-600 text-white", header: "text-red-600" },
  AMARILLO: { titulo: "Amarillo", circulo: "bg-yellow-400 text-yellow-950", header: "text-yellow-600" },
  NARANJA: { titulo: "Naranja", circulo: "bg-orange-500 text-white", header: "text-orange-600" },
};

function AlumnoCard({ inscripcion, dragging }: { inscripcion: InscripcionConHorario; dragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: inscripcion.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "rounded-md border bg-card px-3 py-2 text-sm shadow-sm cursor-grab active:cursor-grabbing select-none",
        isDragging && "opacity-40",
        dragging && "shadow-lg"
      )}
    >
      <div className="font-medium">{inscripcion.nombre}</div>
      {inscripcion.edad && <div className="text-xs text-muted-foreground">{inscripcion.edad}</div>}
    </div>
  );
}

function SinAsignarColumna({ inscripciones }: { inscripciones: InscripcionConHorario[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: "SIN_ASIGNAR" });

  return (
    <div className="w-64 shrink-0">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-sm uppercase tracking-wide text-muted-foreground">Sin asignar</h3>
        <span className="text-xs text-muted-foreground">{inscripciones.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "rounded-xl border-2 border-dashed bg-muted/40 p-3 space-y-2 h-[380px] overflow-y-auto overflow-x-hidden",
          isOver && "ring-2 ring-primary"
        )}
      >
        {inscripciones.map((i) => (
          <AlumnoCard key={i.id} inscripcion={i} />
        ))}
      </div>
    </div>
  );
}

function FichaJugador({
  posicion,
  circuloClass,
}: {
  posicion: JugadorEnCancha<InscripcionConHorario>;
  circuloClass: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: posicion.jugador.id,
  });

  const style: CSSProperties = {
    left: `${posicion.xPct}%`,
    top: `${posicion.yPct}%`,
    transform: `translate(-50%, -50%) translate3d(${transform?.x ?? 0}px, ${transform?.y ?? 0}px, 0)`,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "absolute flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing select-none",
        isDragging && "opacity-40 z-50"
      )}
    >
      <div className={cn("h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shadow-md ring-2 ring-white", circuloClass)}>
        {posicion.numero}
      </div>
      <span className="text-[10px] font-medium text-white bg-black/50 rounded px-1 max-w-[115px] truncate">
        {posicion.jugador.nombre}
      </span>
    </div>
  );
}

function CanchaFormacion({ equipo, jugadores }: { equipo: Equipo; jugadores: InscripcionConHorario[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: equipo });
  const config = EQUIPO_CONFIG[equipo];

  const ordenados = useMemo(
    () =>
      [...jugadores].sort((a, b) => {
        const ta = a.equipoAsignadoAt ? new Date(a.equipoAsignadoAt).getTime() : 0;
        const tb = b.equipoAsignadoAt ? new Date(b.equipoAsignadoAt).getTime() : 0;
        return ta - tb;
      }),
    [jugadores]
  );
  const formacion = useMemo(() => calcularFormacion(ordenados), [ordenados]);

  return (
    <div className="flex-1 min-w-[240px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className={cn("font-bold text-sm uppercase tracking-wide", config.header)}>{config.titulo}</h3>
        <span className="text-xs text-muted-foreground">
          {jugadores.length} jugador{jugadores.length !== 1 ? "es" : ""}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "relative rounded-xl overflow-hidden min-h-[380px] bg-gradient-to-b from-green-600 to-green-700 border-2 border-green-800",
          isOver && "ring-2 ring-primary"
        )}
      >
        <div className="absolute inset-x-0 top-1/2 h-px bg-white/40" />
        <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40" />
        <div className="absolute inset-x-[25%] bottom-0 h-10 border-2 border-b-0 border-white/40 rounded-t-sm" />

        {formacion.map((p) => (
          <FichaJugador key={p.jugador.id} posicion={p} circuloClass={config.circulo} />
        ))}
      </div>
    </div>
  );
}

export function EquiposBoard({ torneoIdInicial }: { torneoIdInicial?: string }) {
  const { torneos, torneoId, torneoActual, seleccionarTorneo } = useTorneoActual(torneoIdInicial);

  const [horarios, setHorarios] = useState<HorarioConCupo[]>([]);
  const [inscripciones, setInscripciones] = useState<InscripcionConHorario[]>([]);
  const [horarioId, setHorarioId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const cargar = useCallback(async () => {
    if (!torneoId) return;
    setLoading(true);
    const [resHorarios, resInscripciones] = await Promise.all([
      fetch(`/api/torneo/horarios?torneoId=${torneoId}`),
      fetch(`/api/torneo/inscripciones?torneoId=${torneoId}`),
    ]);
    const dataHorarios: HorarioConCupo[] = await resHorarios.json();
    setHorarios(dataHorarios);
    setInscripciones(await resInscripciones.json());
    setHorarioId(dataHorarios[0]?.id ?? "");
    setLoading(false);
  }, [torneoId]);

  useEffect(() => { cargar(); }, [cargar]);

  const [historial, setHistorial] = useState<
    Array<{ id: string; equipo: Equipo | null; equipoAsignadoAt: InscripcionConHorario["equipoAsignadoAt"] }>
  >([]);

  useEffect(() => { setHistorial([]); }, [horarioId]);

  const inscripcionesDelHorario = useMemo(
    () => inscripciones.filter((i) => i.horarioId === horarioId),
    [inscripciones, horarioId]
  );

  const sinAsignar = useMemo(
    () => inscripcionesDelHorario.filter((i) => !i.equipo),
    [inscripcionesDelHorario]
  );

  const porEquipo = useMemo(() => {
    const map: Record<Equipo, InscripcionConHorario[]> = { ROJO: [], AMARILLO: [], NARANJA: [] };
    for (const i of inscripcionesDelHorario) {
      if (i.equipo) map[i.equipo].push(i);
    }
    return map;
  }, [inscripcionesDelHorario]);

  const activeInscripcion = inscripciones.find((i) => i.id === activeId) ?? null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const inscripcionId = active.id as string;
    const destino = over.id as string;
    const nuevoEquipo: Equipo | null = destino === "SIN_ASIGNAR" ? null : (destino as Equipo);

    const actual = inscripciones.find((i) => i.id === inscripcionId);
    if (!actual || actual.equipo === nuevoEquipo) return;

    setHistorial((prev) => [
      ...prev,
      { id: inscripcionId, equipo: actual.equipo, equipoAsignadoAt: actual.equipoAsignadoAt },
    ]);

    setInscripciones((prev) =>
      prev.map((i) =>
        i.id === inscripcionId
          ? { ...i, equipo: nuevoEquipo, equipoAsignadoAt: nuevoEquipo ? new Date() : null }
          : i
      )
    );

    await fetch(`/api/torneo/inscripciones/${inscripcionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ equipo: nuevoEquipo }),
    });
  };

  const deshacer = async () => {
    const ultimo = historial[historial.length - 1];
    if (!ultimo) return;
    setHistorial((prev) => prev.slice(0, -1));

    setInscripciones((prev) =>
      prev.map((i) =>
        i.id === ultimo.id ? { ...i, equipo: ultimo.equipo, equipoAsignadoAt: ultimo.equipoAsignadoAt } : i
      )
    );

    await fetch(`/api/torneo/inscripciones/${ultimo.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ equipo: ultimo.equipo, equipoAsignadoAt: ultimo.equipoAsignadoAt }),
    });
  };

  const reiniciarTodo = async () => {
    const asignados = inscripcionesDelHorario.filter((i) => i.equipo);
    if (asignados.length === 0) return;
    if (!confirm(`¿Quitar a los ${asignados.length} jugadores de sus equipos en este horario?`)) return;

    setHistorial([]);
    setInscripciones((prev) =>
      prev.map((i) => (i.horarioId === horarioId ? { ...i, equipo: null, equipoAsignadoAt: null } : i))
    );

    await Promise.all(
      asignados.map((i) =>
        fetch(`/api/torneo/inscripciones/${i.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ equipo: null }),
        })
      )
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-end gap-4">
          <TorneoSwitcher
            torneos={torneos}
            torneoId={torneoId}
            onSelect={seleccionarTorneo}
          />
          <div className="max-w-xs">
            <label className="text-xs text-muted-foreground mb-1 block">Horario</label>
            <Select value={horarioId} onValueChange={setHorarioId}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Elegir horario..." />
              </SelectTrigger>
              <SelectContent>
                {horarios.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.hora} — {h.grupoEdad.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <EstadoTorneoBadge torneo={torneoActual} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={deshacer} disabled={historial.length === 0}>
            <Undo2 className="h-3.5 w-3.5 mr-1.5" />
            Deshacer
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={reiniciarTodo}
            disabled={!inscripcionesDelHorario.some((i) => i.equipo)}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reiniciar todo
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Cargando...</p>
      ) : !horarioId ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No hay horarios cargados</p>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToWindowEdges]}
        >
          <div className="flex flex-wrap gap-4 items-start p-1">
            <SinAsignarColumna inscripciones={sinAsignar} />
            {EQUIPOS.map((equipo) => (
              <CanchaFormacion key={equipo} equipo={equipo} jugadores={porEquipo[equipo]} />
            ))}
          </div>
          <DragOverlay>
            {activeInscripcion ? <AlumnoCard inscripcion={activeInscripcion} dragging /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
