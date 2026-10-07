"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ESTADOS_TORNEO, nombreTorneo } from "@/lib/torneo";
import type { HorarioConCupo, TorneoConResumen } from "@/lib/types";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { useToast } from "@/components/mobile/ToastUndo";
import { EtiquetaSeccion, Segmented } from "@/components/mobile/ui";

const inputCls = "h-12 w-full rounded-xl bg-muted px-3 text-[15px] outline-none";
const btnPrimario =
  "h-12 w-full rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground disabled:opacity-50";

function DatosTorneo({
  torneo,
  onUpdate,
}: {
  torneo: TorneoConResumen;
  onUpdate: () => void;
}) {
  const toast = useToast();
  const [estado, setEstado] = useState(torneo.estado);
  const [precioEfectivo, setPrecioEfectivo] = useState(torneo.precioEfectivo.toString());
  const [precioTransferencia, setPrecioTransferencia] = useState(torneo.precioTransferencia.toString());
  const [guardando, setGuardando] = useState(false);

  const cambiado =
    estado !== torneo.estado ||
    precioEfectivo !== torneo.precioEfectivo.toString() ||
    precioTransferencia !== torneo.precioTransferencia.toString();

  const guardar = async () => {
    setGuardando(true);
    try {
      const res = await fetch(`/api/torneo/torneos/${torneo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado,
          precioEfectivo: parseInt(precioEfectivo) || 0,
          precioTransferencia: parseInt(precioTransferencia) || 0,
        }),
      });
      if (!res.ok) throw new Error();
      onUpdate();
      toast("Torneo guardado");
    } catch {
      toast("No se pudo guardar el torneo");
    }
    setGuardando(false);
  };

  return (
    <div className="space-y-3">
      <div>
        <EtiquetaSeccion>Estado</EtiquetaSeccion>
        <Segmented
          value={estado}
          onChange={setEstado}
          options={ESTADOS_TORNEO.map((e) => ({ value: e.value, label: e.label }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <EtiquetaSeccion>Precio efectivo</EtiquetaSeccion>
          <input className={inputCls} type="number" inputMode="numeric" min="0" value={precioEfectivo} onChange={(e) => setPrecioEfectivo(e.target.value)} />
        </div>
        <div>
          <EtiquetaSeccion>Precio transf.</EtiquetaSeccion>
          <input className={inputCls} type="number" inputMode="numeric" min="0" value={precioTransferencia} onChange={(e) => setPrecioTransferencia(e.target.value)} />
        </div>
      </div>
      <button type="button" className={btnPrimario} onClick={guardar} disabled={!cambiado || guardando}>
        {guardando ? "Guardando..." : "Guardar"}
      </button>
    </div>
  );
}

function FilaHorario({
  horario,
  onUpdate,
}: {
  horario: HorarioConCupo;
  onUpdate: () => void;
}) {
  const toast = useToast();
  const [abierto, setAbierto] = useState(false);
  const [hora, setHora] = useState(horario.hora);
  const [grupoEdadNombre, setGrupoEdadNombre] = useState(horario.grupoEdad.nombre);
  const [cupoMaximo, setCupoMaximo] = useState(horario.cupoMaximo?.toString() ?? "");
  const [activo, setActivo] = useState(horario.activo);
  const [guardando, setGuardando] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);

  const cambiado =
    hora !== horario.hora ||
    grupoEdadNombre !== horario.grupoEdad.nombre ||
    cupoMaximo !== (horario.cupoMaximo?.toString() ?? "") ||
    activo !== horario.activo;

  const guardar = async () => {
    setGuardando(true);
    try {
      const res = await fetch(`/api/torneo/horarios/${horario.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hora,
          grupoEdadNombre,
          cupoMaximo: cupoMaximo ? parseInt(cupoMaximo) : null,
          activo,
        }),
      });
      if (!res.ok) throw new Error();
      onUpdate();
      toast("Horario guardado");
    } catch {
      toast("No se pudo guardar el horario");
    }
    setGuardando(false);
  };

  const eliminar = async () => {
    const res = await fetch(`/api/torneo/horarios/${horario.id}`, { method: "DELETE" });
    if (res.ok) {
      onUpdate();
      toast("Horario eliminado");
    } else {
      const data = await res.json().catch(() => null);
      toast(data?.error ?? "No se pudo eliminar el horario");
      setConfirmarBorrado(false);
    }
  };

  const Chevron = abierto ? ChevronDown : ChevronRight;
  const conInscriptos = horario.inscriptos > 0;

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        className="flex min-h-12 w-full items-center gap-2 px-3 text-left text-[15px] font-medium"
      >
        <Chevron className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 truncate">
          {horario.hora} — {horario.grupoEdad.nombre}
          <span className="text-xs font-normal text-muted-foreground">
            {" "}· cupo {horario.cupoMaximo ?? "sin límite"}
            {!horario.activo && " · inactivo"}
          </span>
        </span>
      </button>

      {abierto && (
        <div className="space-y-3 px-3 pb-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <EtiquetaSeccion>Hora</EtiquetaSeccion>
              <input className={inputCls} value={hora} onChange={(e) => setHora(e.target.value)} />
            </div>
            <div>
              <EtiquetaSeccion>Cupo</EtiquetaSeccion>
              <input className={inputCls} type="number" inputMode="numeric" min="1" placeholder="Sin límite" value={cupoMaximo} onChange={(e) => setCupoMaximo(e.target.value)} />
            </div>
          </div>
          <div>
            <EtiquetaSeccion>Grupo de edad</EtiquetaSeccion>
            <input className={inputCls} value={grupoEdadNombre} onChange={(e) => setGrupoEdadNombre(e.target.value)} />
          </div>
          <button
            type="button"
            onClick={() => setActivo((a) => !a)}
            className={cn(
              "h-12 w-full rounded-xl border text-[15px] font-semibold",
              activo ? "border-[hsl(152_55%_36%)] bg-[hsl(150_50%_94%)] text-[hsl(152_55%_24%)]" : "bg-muted text-muted-foreground"
            )}
          >
            {activo ? "Activo" : "Inactivo"}
          </button>
          <button type="button" className={btnPrimario} onClick={guardar} disabled={!cambiado || guardando}>
            Guardar horario
          </button>
          {conInscriptos ? (
            <p className="text-center text-xs text-muted-foreground">
              No se puede eliminar: tiene {horario.inscriptos} inscripto(s).
            </p>
          ) : confirmarBorrado ? (
            <button type="button" onClick={eliminar} className="h-12 w-full rounded-xl bg-[hsl(0_70%_48%)] text-[15px] font-semibold text-white">
              Confirmar eliminar
            </button>
          ) : (
            <button type="button" onClick={() => setConfirmarBorrado(true)} className="h-12 w-full rounded-xl border border-[hsl(0_70%_48%)] text-[15px] font-semibold text-[hsl(0_70%_48%)]">
              Eliminar horario
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function NuevoHorario({ torneo, onUpdate }: { torneo: TorneoConResumen; onUpdate: () => void }) {
  const toast = useToast();
  const [hora, setHora] = useState("");
  const [grupo, setGrupo] = useState("");
  const [cupo, setCupo] = useState("");
  const [guardando, setGuardando] = useState(false);

  const agregar = async () => {
    setGuardando(true);
    try {
      const res = await fetch("/api/torneo/horarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          torneoId: torneo.id,
          hora,
          grupoEdadNombre: grupo,
          cupoMaximo: cupo ? parseInt(cupo) : null,
        }),
      });
      if (!res.ok) throw new Error();
      setHora("");
      setGrupo("");
      setCupo("");
      onUpdate();
      toast("Horario agregado");
    } catch {
      toast("No se pudo agregar el horario");
    }
    setGuardando(false);
  };

  return (
    <div className="space-y-3">
      <EtiquetaSeccion>Nuevo horario</EtiquetaSeccion>
      <div className="grid grid-cols-2 gap-3">
        <input className={inputCls} placeholder="Hora (18:00)" value={hora} onChange={(e) => setHora(e.target.value)} />
        <input className={inputCls} type="number" inputMode="numeric" min="1" placeholder="Cupo (opcional)" value={cupo} onChange={(e) => setCupo(e.target.value)} />
      </div>
      <input className={inputCls} placeholder="Grupo de edad (ej: 3 y 4 años)" value={grupo} onChange={(e) => setGrupo(e.target.value)} />
      <button type="button" className={btnPrimario} onClick={agregar} disabled={!hora || !grupo || guardando}>
        Agregar
      </button>
    </div>
  );
}

// Reemplaza a GestionarTorneoDialog en mobile.
export function GestionarTorneoSheet({
  open,
  onOpenChange,
  torneo,
  horarios,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  torneo: TorneoConResumen | null;
  horarios: HorarioConCupo[];
  onUpdate: () => void;
}) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={torneo ? `Gestionar · ${nombreTorneo(torneo.mes, torneo.anio)}` : "Gestionar torneo"}
    >
      {torneo && (
        <div className="space-y-5">
          <DatosTorneo torneo={torneo} onUpdate={onUpdate} />
          <div>
            <EtiquetaSeccion>Horarios</EtiquetaSeccion>
            <div className="overflow-hidden rounded-[14px] border">
              {horarios.map((h) => (
                <FilaHorario key={h.id} horario={h} onUpdate={onUpdate} />
              ))}
              {horarios.length === 0 && (
                <p className="px-3 py-3 text-sm text-muted-foreground">Todavía no hay horarios</p>
              )}
            </div>
          </div>
          <NuevoHorario torneo={torneo} onUpdate={onUpdate} />
        </div>
      )}
    </BottomSheet>
  );
}
