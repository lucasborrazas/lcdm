"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ModalResponsivo } from "@/components/shared/ModalResponsivo";
import { useReportarCambios } from "@/components/shared/CierreProtegido";
import { useEsDesktop } from "@/components/shared/useEsDesktop";
import { useToast } from "@/components/mobile/ToastUndo";
import { EtiquetaSeccion, SwitchGrande } from "@/components/mobile/ui";
import { useFetchJson } from "@/components/shared/useFetchJson";
import { AjustesNuevos } from "@/components/configuracion/AjustesNuevos";
import { precioEfectivoDesde } from "@/lib/premios";
import { PRECIOS_POR_DEFECTO, type PreciosConfig } from "@/lib/preciosConfig";
import type { EntregaConResumen, TurnoConConteo } from "@/lib/types";
import { btnPrimario, campo } from "./estilos";

const CONFIG_INICIAL = { precios: PRECIOS_POR_DEFECTO };

async function leerError(res: Response, porDefecto: string): Promise<string> {
  const data = await res.json().catch(() => null);
  return typeof data?.error === "string" ? data.error : porDefecto;
}

function Precios({ entrega, onUpdate }: { entrega: EntregaConResumen; onUpdate: () => void }) {
  const [transferencia, setTransferencia] = useState(entrega.precioTransferencia.toString());
  const [efectivo, setEfectivo] = useState(entrega.precioEfectivo.toString());
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: config } = useFetchJson<{ precios: PreciosConfig }>("/api/configuracion", CONFIG_INICIAL);
  const descuento = config.precios.bonoDescuentoEfectivoPct;

  const cambiado =
    transferencia !== entrega.precioTransferencia.toString() || efectivo !== entrega.precioEfectivo.toString();
  useReportarCambios(cambiado);

  const calcularEfectivo = () =>
    setEfectivo(precioEfectivoDesde(parseInt(transferencia) || 0, descuento).toString());

  const guardar = async () => {
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch(`/api/premios/entregas/${entrega.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          precioTransferencia: parseInt(transferencia) || 0,
          precioEfectivo: parseInt(efectivo) || 0,
        }),
      });
      if (!res.ok) throw new Error(await leerError(res, "No se pudo guardar"));
      onUpdate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    }
    setGuardando(false);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <EtiquetaSeccion>Bono transferencia</EtiquetaSeccion>
          <input className={campo} type="number" inputMode="numeric" min="0" value={transferencia} onChange={(e) => setTransferencia(e.target.value)} />
        </div>
        <div>
          <EtiquetaSeccion>Bono efectivo</EtiquetaSeccion>
          <input className={campo} type="number" inputMode="numeric" min="0" value={efectivo} onChange={(e) => setEfectivo(e.target.value)} />
        </div>
      </div>
      <button type="button" onClick={calcularEfectivo} className="text-sm font-semibold text-primary">
        Calcular efectivo ({descuento}% menos, redondeado al millar)
      </button>
      <p className="text-xs text-muted-foreground">
        Los precios nuevos rigen para las próximas inscripciones; las familias ya cargadas conservan su monto.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button type="button" className={btnPrimario} onClick={guardar} disabled={!cambiado || guardando}>
        {guardando ? "Guardando..." : "Guardar precios"}
      </button>
    </div>
  );
}

function FilaTurno({ turno, onUpdate }: { turno: TurnoConConteo; onUpdate: () => void }) {
  const toast = useToast();
  const esDesktop = useEsDesktop();
  const [hora, setHora] = useState(turno.hora);
  const [grupo, setGrupo] = useState(turno.grupoEdad?.nombre ?? "");
  const [activo, setActivo] = useState(turno.activo);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cambiado = hora !== turno.hora || grupo !== (turno.grupoEdad?.nombre ?? "") || activo !== turno.activo;
  useReportarCambios(cambiado);

  const guardar = async () => {
    if (!hora) return;
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch(`/api/premios/turnos/${turno.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hora, grupoEdadNombre: grupo.trim() || null, activo }),
      });
      if (!res.ok) throw new Error(await leerError(res, "No se pudo guardar el turno"));
      onUpdate();
      toast("Turno guardado");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el turno");
    }
    setGuardando(false);
  };

  const eliminar = async () => {
    if (esDesktop && !confirm(`¿Eliminar el turno de las ${turno.hora}?`)) return;
    const res = await fetch(`/api/premios/turnos/${turno.id}`, { method: "DELETE" });
    if (res.ok) {
      onUpdate();
      toast("Turno eliminado");
    } else {
      setError(await leerError(res, "No se pudo eliminar el turno"));
    }
  };

  return (
    <div className="space-y-2 rounded-[14px] border p-3">
      <div className="flex items-center gap-2">
        <input className={`${campo} !w-32 shrink-0`} type="time" value={hora} onChange={(e) => setHora(e.target.value)} aria-label="Hora" />
        <input
          className={campo}
          placeholder="Grupo etario (opcional)"
          value={grupo}
          onChange={(e) => setGrupo(e.target.value)}
          aria-label="Grupo etario"
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <SwitchGrande checked={activo} onChange={() => setActivo(!activo)} label="Turno activo" />
          {activo ? "Activo" : "Inactivo"}
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={eliminar}
            aria-label="Eliminar turno"
            className="flex h-10 w-10 items-center justify-center rounded-xl border text-destructive md:h-8 md:w-8 md:rounded-lg"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={!cambiado || guardando || !hora}
            className="h-10 rounded-xl bg-primary px-4 text-sm md:h-8 md:rounded-lg font-semibold text-primary-foreground disabled:opacity-50"
          >
            Guardar
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function NuevoTurno({ entregaId, onUpdate }: { entregaId: string; onUpdate: () => void }) {
  const [hora, setHora] = useState("");
  const [grupo, setGrupo] = useState("");
  const [error, setError] = useState<string | null>(null);

  useReportarCambios(!!(hora || grupo));

  const agregar = async () => {
    if (!hora) return;
    setError(null);
    const res = await fetch("/api/premios/turnos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entregaId, hora, grupoEdadNombre: grupo.trim() || null }),
    });
    if (!res.ok) {
      setError(await leerError(res, "No se pudo agregar el turno"));
      return;
    }
    setHora("");
    setGrupo("");
    onUpdate();
  };

  return (
    <div className="space-y-2 rounded-[14px] border border-dashed p-3">
      <EtiquetaSeccion>Nuevo turno</EtiquetaSeccion>
      <div className="flex items-center gap-2">
        <input className={`${campo} !w-32 shrink-0`} type="time" value={hora} onChange={(e) => setHora(e.target.value)} aria-label="Hora del nuevo turno" />
        <input className={campo} placeholder="Grupo etario (opcional)" value={grupo} onChange={(e) => setGrupo(e.target.value)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        type="button"
        onClick={agregar}
        disabled={!hora}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-[15px] font-semibold md:h-9 md:rounded-lg md:text-sm disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        Agregar turno
      </button>
    </div>
  );
}

export function GestionarEntregaModal({
  open,
  onOpenChange,
  entrega,
  turnos,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entrega: EntregaConResumen | null;
  turnos: TurnoConConteo[];
  onUpdate: () => void;
}) {
  return (
    <ModalResponsivo
      open={open && !!entrega}
      onOpenChange={onOpenChange}
      title={entrega ? `Gestionar entrega ${entrega.anio}` : "Gestionar entrega"}
    >
      {entrega && (
        <div className="space-y-5">
          <Precios entrega={entrega} onUpdate={onUpdate} />
          <div className="space-y-2.5 border-t pt-4">
            <EtiquetaSeccion>Turnos</EtiquetaSeccion>
            {turnos.map((t) => (
              <FilaTurno key={`${t.id}-${t.updatedAt}`} turno={t} onUpdate={onUpdate} />
            ))}
            <NuevoTurno entregaId={entrega.id} onUpdate={onUpdate} />
          </div>
          <AjustesNuevos seccion="PREMIOS" />
        </div>
      )}
    </ModalResponsivo>
  );
}
