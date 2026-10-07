"use client";

import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Save } from "lucide-react";
import { ESTADOS_TORNEO, nombreTorneo } from "@/lib/torneo";
import type { HorarioConCupo, TorneoConResumen } from "@/lib/types";
import { useCierreProtegido, ProtegerCierre, useReportarCambios } from "@/components/shared/CierreProtegido";

function FilaHorario({
  horario,
  onSaved,
}: {
  horario: HorarioConCupo;
  onSaved: () => void;
}) {
  const [hora, setHora] = useState(horario.hora);
  const [grupoEdadNombre, setGrupoEdadNombre] = useState(horario.grupoEdad.nombre);
  const [cupoMaximo, setCupoMaximo] = useState(horario.cupoMaximo?.toString() ?? "");
  const [activo, setActivo] = useState(horario.activo);
  const [guardando, setGuardando] = useState(false);

  const cambiado =
    hora !== horario.hora ||
    grupoEdadNombre !== horario.grupoEdad.nombre ||
    cupoMaximo !== (horario.cupoMaximo?.toString() ?? "") ||
    activo !== horario.activo;
  useReportarCambios(cambiado);

  const guardar = async () => {
    setGuardando(true);
    await fetch(`/api/torneo/horarios/${horario.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hora,
        grupoEdadNombre,
        cupoMaximo: cupoMaximo ? parseInt(cupoMaximo) : null,
        activo,
      }),
    });
    setGuardando(false);
    onSaved();
  };

  const eliminar = async () => {
    if (!confirm(`¿Eliminar el horario ${horario.hora}?`)) return;
    const res = await fetch(`/api/torneo/horarios/${horario.id}`, { method: "DELETE" });
    if (res.ok) {
      onSaved();
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "No se pudo eliminar el horario");
    }
  };

  return (
    <div className="grid grid-cols-[5rem_1fr_5rem_auto_auto_auto] gap-2 items-center border-b py-2 last:border-b-0">
      <Input value={hora} onChange={(e) => setHora(e.target.value)} className="h-8 text-sm" />
      <Input value={grupoEdadNombre} onChange={(e) => setGrupoEdadNombre(e.target.value)} className="h-8 text-sm" />
      <Input
        type="number"
        min="1"
        placeholder="Sin límite"
        value={cupoMaximo}
        onChange={(e) => setCupoMaximo(e.target.value)}
        className="h-8 text-sm"
      />
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
        <Checkbox checked={activo} onCheckedChange={(v) => setActivo(!!v)} />
        Activo
      </label>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={!cambiado || guardando}
        onClick={guardar}
        title="Guardar"
      >
        <Save className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-red-500 hover:text-red-600"
        onClick={eliminar}
        title={horario.inscriptos > 0 ? `Tiene ${horario.inscriptos} inscripto(s)` : "Eliminar"}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function DatosTorneo({
  torneo,
  onSaved,
}: {
  torneo: TorneoConResumen;
  onSaved: () => void;
}) {
  const [estado, setEstado] = useState(torneo.estado);
  const [precioEfectivo, setPrecioEfectivo] = useState(torneo.precioEfectivo.toString());
  const [precioTransferencia, setPrecioTransferencia] = useState(torneo.precioTransferencia.toString());
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setEstado(torneo.estado);
    setPrecioEfectivo(torneo.precioEfectivo.toString());
    setPrecioTransferencia(torneo.precioTransferencia.toString());
  }, [torneo]);

  const cambiado =
    estado !== torneo.estado ||
    precioEfectivo !== torneo.precioEfectivo.toString() ||
    precioTransferencia !== torneo.precioTransferencia.toString();
  useReportarCambios(cambiado);

  const guardar = async () => {
    setGuardando(true);
    await fetch(`/api/torneo/torneos/${torneo.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        estado,
        precioEfectivo: parseInt(precioEfectivo) || 0,
        precioTransferencia: parseInt(precioTransferencia) || 0,
      }),
    });
    setGuardando(false);
    onSaved();
  };

  return (
    <div className="space-y-3 pb-4 mb-4 border-b">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Estado</label>
          <Select value={estado} onValueChange={(v) => setEstado(v as TorneoConResumen["estado"])}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ESTADOS_TORNEO.map((e) => (
                <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Precio efectivo</label>
          <Input type="number" min="0" value={precioEfectivo} onChange={(e) => setPrecioEfectivo(e.target.value)} className="h-8 text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Precio transferencia</label>
          <Input type="number" min="0" value={precioTransferencia} onChange={(e) => setPrecioTransferencia(e.target.value)} className="h-8 text-sm" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button size="sm" onClick={guardar} disabled={!cambiado || guardando}>
          <Save className="h-3.5 w-3.5 mr-1.5" />
          {guardando ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
}

export function GestionarTorneoDialog({
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
  const [nuevaHora, setNuevaHora] = useState("");
  const [nuevoGrupoEdad, setNuevoGrupoEdad] = useState("");
  const [nuevoCupo, setNuevoCupo] = useState("");

  // el formulario de "nuevo horario" tambien cuenta si quedo algo escrito
  const proteccion = useCierreProtegido({
    open,
    onOpenChange,
    dirty: !!(nuevaHora || nuevoGrupoEdad || nuevoCupo),
  });

  useEffect(() => {
    if (open) {
      setNuevaHora("");
      setNuevoGrupoEdad("");
      setNuevoCupo("");
    }
  }, [open]);

  const agregar = async () => {
    if (!nuevaHora || !nuevoGrupoEdad || !torneo) return;
    await fetch("/api/torneo/horarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        torneoId: torneo.id,
        hora: nuevaHora,
        grupoEdadNombre: nuevoGrupoEdad,
        cupoMaximo: nuevoCupo ? parseInt(nuevoCupo) : null,
      }),
    });
    setNuevaHora("");
    setNuevoGrupoEdad("");
    setNuevoCupo("");
    onUpdate();
  };

  return (
    <Dialog open={open} onOpenChange={proteccion.onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <ProtegerCierre proteccion={proteccion}>
        <DialogHeader>
          <DialogTitle>
            {torneo ? `Gestionar torneo — ${nombreTorneo(torneo.mes, torneo.anio)}` : "Gestionar torneo"}
          </DialogTitle>
        </DialogHeader>

        {torneo && <DatosTorneo torneo={torneo} onSaved={onUpdate} />}

        <div className="grid grid-cols-[5rem_1fr_5rem_auto_auto_auto] gap-2 text-xs text-muted-foreground font-medium px-0">
          <span>Hora</span>
          <span>Grupo de edad</span>
          <span>Cupo</span>
          <span></span>
          <span></span>
          <span></span>
        </div>

        <div>
          {horarios.map((h) => (
            <FilaHorario key={h.id} horario={h} onSaved={onUpdate} />
          ))}
        </div>

        <div className="grid grid-cols-[5rem_1fr_5rem_auto] gap-2 items-center pt-2 border-t">
          <Input placeholder="18:00" value={nuevaHora} onChange={(e) => setNuevaHora(e.target.value)} className="h-8 text-sm" />
          <Input placeholder="Ej: 3 y 4 años" value={nuevoGrupoEdad} onChange={(e) => setNuevoGrupoEdad(e.target.value)} className="h-8 text-sm" />
          <Input
            type="number"
            min="1"
            placeholder="Sin límite"
            value={nuevoCupo}
            onChange={(e) => setNuevoCupo(e.target.value)}
            className="h-8 text-sm"
          />
          <Button size="sm" onClick={agregar} disabled={!nuevaHora || !nuevoGrupoEdad}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Agregar
          </Button>
        </div>
        </ProtegerCierre>
      </DialogContent>
    </Dialog>
  );
}
