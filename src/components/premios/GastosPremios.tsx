"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ModalResponsivo } from "@/components/shared/ModalResponsivo";
import { useReportarCambios } from "@/components/shared/CierreProtegido";
import { useFetchJson } from "@/components/shared/useFetchJson";
import { useToast } from "@/components/mobile/ToastUndo";
import { EtiquetaSeccion } from "@/components/mobile/ui";
import { formatearMoneda } from "@/lib/calculations";
import type { GastoEntrega } from "@/lib/types";
import { EncabezadoPremios, SinEntrega } from "./EncabezadoPremios";
import { btnPeligro, btnPrimario, campo } from "./estilos";
import { useEntregaActual } from "./useEntregaActual";

const SIN_GASTOS: GastoEntrega[] = [];

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
      setError("No se pudo guardar el gasto.");
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
            Sí, eliminar el gasto
          </button>
        ) : (
          <button type="button" onClick={() => setConfirmandoBorrado(true)} className={btnPeligro}>
            Eliminar gasto
          </button>
        ))}
    </div>
  );
}

export function GastosPremios({ entregaIdInicial }: { entregaIdInicial?: string }) {
  const toast = useToast();
  const { entregas, entregaId, seleccionarEntrega, loading, recargarEntregas } = useEntregaActual(entregaIdInicial);
  const { data: gastos, loading: cargando, recargar } = useFetchJson<GastoEntrega[]>(
    entregaId ? `/api/premios/gastos?entregaId=${entregaId}` : null,
    SIN_GASTOS
  );
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<GastoEntrega | null>(null);

  const total = gastos.reduce((s, g) => s + g.monto, 0);

  const actualizar = async () => {
    await Promise.all([recargar(), recargarEntregas()]);
  };

  const abrir = (g: GastoEntrega | null) => {
    setEditando(g);
    setAbierto(true);
  };

  const eliminar = async (g: GastoEntrega) => {
    const res = await fetch(`/api/premios/gastos/${g.id}`, { method: "DELETE" });
    if (!res.ok) return toast("No se pudo eliminar el gasto");
    await actualizar();
    toast(`${g.concepto} eliminado`, async () => {
      const r = await fetch("/api/premios/gastos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entregaId: g.entregaId, concepto: g.concepto, monto: g.monto }),
      });
      if (!r.ok) toast("No se pudo deshacer");
      await actualizar();
    });
  };

  const onEntregaCreada = async (id: string) => {
    await recargarEntregas();
    seleccionarEntrega(id);
  };

  return (
    <>
      <EncabezadoPremios
        titulo="Gastos"
        descripcion="Copas, medallas y todo lo que se paga para la entrega"
        entregas={entregas}
        entregaId={entregaId}
        onSelect={seleccionarEntrega}
        acciones={
          <Button onClick={() => abrir(null)} disabled={!entregaId}>
            <Plus className="mr-1.5 h-4 w-4" />
            Agregar gasto
          </Button>
        }
      />

      {!loading && entregas.length === 0 ? (
        <SinEntrega entregas={entregas} onCreada={onEntregaCreada} />
      ) : (
        <div className="max-w-2xl">
          <div className="rounded-[18px] bg-primary p-4 text-primary-foreground">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-80">Total de gastos</div>
            <div className="text-[30px] font-bold leading-tight">{formatearMoneda(total)}</div>
          </div>

          <div className="mt-5">
            <EtiquetaSeccion>Gastos de la entrega</EtiquetaSeccion>
            <div className="overflow-hidden rounded-[14px] border">
              {cargando && <p className="px-4 py-3 text-sm text-muted-foreground">Cargando...</p>}
              {!cargando && gastos.length === 0 && (
                <p className="px-4 py-3 text-sm text-muted-foreground">Sin gastos cargados</p>
              )}
              {gastos.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => abrir(g)}
                  className="flex min-h-12 w-full items-center justify-between gap-3 border-b px-4 text-left last:border-b-0"
                >
                  <span className="min-w-0 truncate text-[15px] font-medium">{g.concepto}</span>
                  <span className="shrink-0 text-[15px] font-semibold">{formatearMoneda(g.monto)}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => abrir(null)}
              disabled={!entregaId}
              className="mt-2.5 flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed text-[15px] font-semibold text-muted-foreground disabled:opacity-50 md:hidden"
            >
              <Plus className="h-4 w-4" />
              Agregar gasto
            </button>
          </div>
        </div>
      )}

      <ModalResponsivo
        open={abierto && !!entregaId}
        onOpenChange={setAbierto}
        title={editando ? "Editar gasto" : "Nuevo gasto"}
        className="sm:max-w-sm"
      >
        {entregaId && (
          <FormGasto
            key={editando?.id ?? "nuevo"}
            entregaId={entregaId}
            gasto={editando}
            onCerrar={() => setAbierto(false)}
            onActualizar={actualizar}
            onEliminar={eliminar}
          />
        )}
      </ModalResponsivo>
    </>
  );
}
