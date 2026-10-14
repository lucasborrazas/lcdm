"use client";

import { useState } from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MonedaCell } from "@/components/shared/MonedaCell";
import { useFetchJson } from "@/components/shared/useFetchJson";
import { ModalResponsivo } from "@/components/shared/ModalResponsivo";
import { useReportarCambios } from "@/components/shared/CierreProtegido";
import { useToast } from "@/components/mobile/ToastUndo";
import { EtiquetaSeccion } from "@/components/mobile/ui";
import { formatearMoneda } from "@/lib/calculations";
import type { GastoEntrega } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EncabezadoPremios, SinEntrega } from "./EncabezadoPremios";
import { useEntregaActual } from "./useEntregaActual";
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

const SIN_GASTOS: GastoEntrega[] = [];

async function enviar(url: string, method: string, body?: unknown): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Escritorio: fila editable en la tabla, igual que en Torneo.
function FilaGasto({
  gasto,
  onActualizar,
  onEliminar,
}: {
  gasto: GastoEntrega;
  onActualizar: () => Promise<void>;
  onEliminar: (g: GastoEntrega) => void;
}) {
  const toast = useToast();
  const [editando, setEditando] = useState(false);
  const [concepto, setConcepto] = useState(gasto.concepto);
  const [monto, setMonto] = useState(gasto.monto.toString());
  const [guardando, setGuardando] = useState(false);

  const cambiado = concepto !== gasto.concepto || monto !== gasto.monto.toString();

  const empezar = () => {
    setConcepto(gasto.concepto);
    setMonto(gasto.monto.toString());
    setEditando(true);
  };

  const guardar = async () => {
    if (!concepto.trim()) return;
    setGuardando(true);
    const ok = await enviar(`/api/premios/gastos/${gasto.id}`, "PUT", {
      concepto: concepto.trim(),
      monto: parseInt(monto) || 0,
    });
    setGuardando(false);
    if (!ok) return toast("No se pudo guardar el costo");
    setEditando(false);
    await onActualizar();
  };

  if (editando) {
    return (
      <TableRow>
        <TableCell>
          <Input value={concepto} onChange={(e) => setConcepto(e.target.value)} className="h-8 text-sm" autoFocus />
        </TableCell>
        <TableCell className="text-right">
          <Input type="number" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} className="h-8 text-right text-sm" />
        </TableCell>
        <TableCell>
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!cambiado || guardando} onClick={guardar}>
              <Save className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditando(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell>{gasto.concepto}</TableCell>
      <TableCell className="text-right">
        <MonedaCell valor={gasto.monto} />
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={empezar}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-500 hover:text-red-600"
            onClick={() => confirm(`¿Eliminar el costo "${gasto.concepto}"?`) && onEliminar(gasto)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function GastosPremios({ entregaIdInicial }: { entregaIdInicial?: string }) {
  const toast = useToast();
  const { entregas, entregaId, seleccionarEntrega, loading, recargarEntregas } = useEntregaActual(entregaIdInicial);
  const { data: gastos, loading: cargando, recargar } = useFetchJson<GastoEntrega[]>(
    entregaId ? `/api/premios/gastos?entregaId=${entregaId}` : null,
    SIN_GASTOS
  );
  const [nuevoConcepto, setNuevoConcepto] = useState("");
  const [nuevoMonto, setNuevoMonto] = useState("");
  const [hoja, setHoja] = useState<{ gasto: GastoEntrega | null } | null>(null);

  const total = gastos.reduce((s, g) => s + g.monto, 0);

  const actualizar = async () => {
    await Promise.all([recargar(), recargarEntregas()]);
  };

  const agregar = async () => {
    if (!entregaId || !nuevoConcepto.trim() || nuevoMonto === "") return;
    const ok = await enviar("/api/premios/gastos", "POST", {
      entregaId,
      concepto: nuevoConcepto.trim(),
      monto: parseInt(nuevoMonto) || 0,
    });
    if (!ok) return toast("No se pudo agregar el costo");
    setNuevoConcepto("");
    setNuevoMonto("");
    await actualizar();
  };

  const eliminar = async (g: GastoEntrega) => {
    if (!(await enviar(`/api/premios/gastos/${g.id}`, "DELETE"))) return toast("No se pudo eliminar el costo");
    await actualizar();
    toast(`${g.concepto} eliminado`, async () => {
      const ok = await enviar("/api/premios/gastos", "POST", { entregaId: g.entregaId, concepto: g.concepto, monto: g.monto });
      if (!ok) toast("No se pudo deshacer");
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
      />

      {!loading && entregas.length === 0 ? (
        <SinEntrega entregas={entregas} onCreada={onEntregaCreada} />
      ) : (
        <div className="max-w-2xl">
          <div className="rounded-[18px] bg-primary p-4 text-primary-foreground">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-80">Total de costos</div>
            <div className="text-[30px] font-bold leading-tight">{formatearMoneda(total)}</div>
          </div>

          {/* Escritorio: tabla con edicion en la fila y alta al pie */}
          <Card className="mt-5 hidden md:block">
            <CardHeader>
              <CardTitle className="text-sm">Costos de la entrega</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3 rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cargando ? (
                      <TableRow>
                        <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">Cargando...</TableCell>
                      </TableRow>
                    ) : gastos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">Sin costos cargados</TableCell>
                      </TableRow>
                    ) : (
                      gastos.map((g) => (
                        <FilaGasto key={`${g.id}-${g.concepto}-${g.monto}`} gasto={g} onActualizar={actualizar} onEliminar={eliminar} />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Concepto (ej: Copas)"
                  value={nuevoConcepto}
                  onChange={(e) => setNuevoConcepto(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min="0"
                  placeholder="Monto"
                  value={nuevoMonto}
                  onChange={(e) => setNuevoMonto(e.target.value)}
                  className="w-32"
                />
                <Button onClick={agregar} disabled={!nuevoConcepto.trim() || nuevoMonto === "" || !entregaId}>
                  <Plus className="mr-1 h-4 w-4" />
                  Agregar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Mobile: lista, toque para editar y boton para agregar */}
          <div className="mt-5 md:hidden">
            <EtiquetaSeccion>Costos de la entrega</EtiquetaSeccion>
            <div className="overflow-hidden rounded-[14px] border">
              {cargando && <p className="px-4 py-3 text-sm text-muted-foreground">Cargando...</p>}
              {!cargando && gastos.length === 0 && (
                <p className="px-4 py-3 text-sm text-muted-foreground">Sin costos cargados</p>
              )}
              {gastos.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setHoja({ gasto: g })}
                  className="flex min-h-12 w-full items-center justify-between gap-3 border-b px-4 text-left last:border-b-0"
                >
                  <span className="min-w-0 truncate text-[15px] font-medium">{g.concepto}</span>
                  <span className="shrink-0 text-[15px] font-semibold">{formatearMoneda(g.monto)}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setHoja({ gasto: null })}
              disabled={!entregaId}
              className="mt-2.5 flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed text-[15px] font-semibold text-muted-foreground disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Agregar costo
            </button>
          </div>
        </div>
      )}

      <ModalResponsivo
        open={!!hoja && !!entregaId}
        onOpenChange={(v) => !v && setHoja(null)}
        title={hoja?.gasto ? "Editar costo" : "Nuevo costo"}
        className="sm:max-w-sm"
      >
        {entregaId && hoja && (
          <FormGasto
            key={hoja.gasto?.id ?? "nuevo"}
            entregaId={entregaId}
            gasto={hoja.gasto}
            onCerrar={() => setHoja(null)}
            onActualizar={actualizar}
            onEliminar={eliminar}
          />
        )}
      </ModalResponsivo>
    </>
  );
}
