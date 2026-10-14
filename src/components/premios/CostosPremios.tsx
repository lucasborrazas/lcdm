"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModalResponsivo } from "@/components/shared/ModalResponsivo";
import { useReportarCambios } from "@/components/shared/CierreProtegido";
import { useToast } from "@/components/mobile/ToastUndo";
import { EtiquetaSeccion } from "@/components/mobile/ui";
import { formatearMoneda } from "@/lib/calculations";
import type { GastoEntrega } from "@/lib/types";
import { btnPeligro, btnPrimario, campo } from "./estilos";

function FormGasto({
  entregaId,
  gasto,
  onCerrar,
  onActualizar,
  onEliminar,
}: {
  entregaId: string;
  gasto: GastoEntrega | null;
  onCerrar: () => void;
  onActualizar: () => Promise<void>;
  onEliminar: (g: GastoEntrega) => void;
}) {
  const [concepto, setConcepto] = useState(gasto?.concepto ?? "");
  const [monto, setMonto] = useState(gasto?.monto.toString() ?? "");
  const [guardando, setGuardando] = useState(false);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useReportarCambios(concepto !== (gasto?.concepto ?? "") || monto !== (gasto?.monto.toString() ?? ""));

  const guardar = async () => {
    if (!concepto.trim() || monto === "") return setError("Completá el concepto y el monto.");
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch(gasto ? `/api/premios/gastos/${gasto.id}` : "/api/premios/gastos", {
        method: gasto ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(gasto ? {} : { entregaId }), concepto: concepto.trim(), monto: parseInt(monto) || 0 }),
      });
      if (!res.ok) throw new Error();
      await onActualizar();
      onCerrar();
    } catch {
      setError("No se pudo guardar el costo.");
    }
    setGuardando(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <EtiquetaSeccion>Concepto</EtiquetaSeccion>
        <input className={campo} placeholder="Ej: Copas" value={concepto} onChange={(e) => setConcepto(e.target.value)} />
      </div>
      <div>
        <EtiquetaSeccion>Monto ($)</EtiquetaSeccion>
        <input className={campo} type="number" inputMode="numeric" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button type="button" onClick={guardar} disabled={guardando} className={btnPrimario}>
        {guardando ? "Guardando..." : gasto ? "Guardar" : "Agregar"}
      </button>
      {gasto &&
        (confirmandoBorrado ? (
          <button
            type="button"
            onClick={() => {
              onEliminar(gasto);
              onCerrar();
            }}
            className={cn(btnPeligro, "bg-destructive text-white")}
          >
            Sí, eliminar el costo
          </button>
        ) : (
          <button type="button" onClick={() => setConfirmandoBorrado(true)} className={btnPeligro}>
            Eliminar costo
          </button>
        ))}
    </div>
  );
}

// Costos de la entrega dentro del Resumen, igual que en Torneo: lista, fila
// para agregar al pie y toque en un costo para editarlo o borrarlo.
export function CostosPremios({
  entregaId,
  gastos,
  cargando,
  onActualizar,
}: {
  entregaId: string;
  gastos: GastoEntrega[];
  cargando: boolean;
  onActualizar: () => Promise<void>;
}) {
  const toast = useToast();
  const [editando, setEditando] = useState<GastoEntrega | null>(null);
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [agregando, setAgregando] = useState(false);

  const agregar = async () => {
    if (!concepto.trim() || monto === "") return;
    setAgregando(true);
    const res = await fetch("/api/premios/gastos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entregaId, concepto: concepto.trim(), monto: parseInt(monto) || 0 }),
    });
    setAgregando(false);
    if (!res.ok) return toast("No se pudo agregar el costo");
    setConcepto("");
    setMonto("");
    await onActualizar();
  };

  const eliminar = async (g: GastoEntrega) => {
    const res = await fetch(`/api/premios/gastos/${g.id}`, { method: "DELETE" });
    if (!res.ok) return toast("No se pudo eliminar el costo");
    await onActualizar();
    toast(`${g.concepto} eliminado`, async () => {
      const r = await fetch("/api/premios/gastos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entregaId: g.entregaId, concepto: g.concepto, monto: g.monto }),
      });
      if (!r.ok) toast("No se pudo deshacer");
      await onActualizar();
    });
  };

  return (
    <div>
      <EtiquetaSeccion>Costos de la entrega</EtiquetaSeccion>
      <div className="overflow-hidden rounded-[14px] border">
        {cargando && <p className="px-4 py-3 text-sm text-muted-foreground">Cargando...</p>}
        {!cargando && gastos.length === 0 && <p className="px-4 py-3 text-sm text-muted-foreground">Sin costos cargados</p>}
        {gastos.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setEditando(g)}
            className="flex min-h-12 w-full items-center justify-between gap-3 border-b px-4 text-left last:border-b-0"
          >
            <span className="min-w-0 truncate text-[15px] font-medium">{g.concepto}</span>
            <span className="shrink-0 text-[15px] font-semibold">{formatearMoneda(g.monto)}</span>
          </button>
        ))}
      </div>

      <form
        className="mt-2.5 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          agregar();
        }}
      >
        <input className={campo} placeholder="Concepto (ej: Copas)" value={concepto} onChange={(e) => setConcepto(e.target.value)} />
        <input
          className={cn(campo, "!w-28 shrink-0")}
          type="number"
          inputMode="numeric"
          min="0"
          placeholder="Monto"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
        />
        <button
          type="submit"
          disabled={!concepto.trim() || monto === "" || agregando}
          className="flex h-12 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Agregar</span>
        </button>
      </form>

      <ModalResponsivo open={!!editando} onOpenChange={(v) => !v && setEditando(null)} title="Editar costo" className="sm:max-w-sm">
        {editando && (
          <FormGasto
            key={editando.id}
            entregaId={entregaId}
            gasto={editando}
            onCerrar={() => setEditando(null)}
            onActualizar={onActualizar}
            onEliminar={eliminar}
          />
        )}
      </ModalResponsivo>
    </div>
  );
}
