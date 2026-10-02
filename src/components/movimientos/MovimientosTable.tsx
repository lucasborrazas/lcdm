"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { MonedaCell } from "@/components/shared/MonedaCell";
import { formatearFecha, formatearMoneda } from "@/lib/calculations";
import { EditarCompraDialog } from "./EditarCompraDialog";
import type { MovimientoConProducto } from "@/lib/types";

type Impacto = { productoId: string; productoNombre: string; talle: string; costoAnterior: number | null; costoNuevo: number | null };

type GrupoCompra = {
  compraId: string;
  fecha: Date | string;
  motivo: string;
  lineas: MovimientoConProducto[];
  total: number;
};

function ConfirmarEliminarDialog({
  compraId,
  open,
  onOpenChange,
  onSuccess,
}: {
  compraId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [cargando, setCargando] = useState(true);
  const [impactos, setImpactos] = useState<Impacto[]>([]);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    if (!open || !compraId) return;
    setCargando(true);
    fetch(`/api/movimientos/compra/${compraId}/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .then((r) => r.json())
      .then((data) => {
        setImpactos(data.impactos ?? []);
        setCargando(false);
      });
  }, [open, compraId]);

  const eliminar = async () => {
    if (!compraId) return;
    setEliminando(true);
    const res = await fetch(`/api/movimientos/compra/${compraId}`, { method: "DELETE" });
    setEliminando(false);
    if (res.ok) {
      onOpenChange(false);
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Eliminar esta compra?</DialogTitle>
        </DialogHeader>
        {cargando ? (
          <p className="text-sm text-muted-foreground py-4">Verificando impacto...</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Se van a eliminar todas las líneas de esta compra y se va a descontar el stock que sumaron.
            </p>
            {impactos.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Esto va a cambiar el costo promedio de:</p>
                {impactos.map((i) => (
                  <div key={i.productoId} className="flex items-center justify-between text-sm border rounded-md px-3 py-2">
                    <span>{i.productoNombre} T.{i.talle}</span>
                    <span>
                      {formatearMoneda(i.costoAnterior ?? 0)} → <strong>{formatearMoneda(i.costoNuevo ?? 0)}</strong>
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button variant="destructive" disabled={eliminando} onClick={eliminar}>
                {eliminando ? "Eliminando..." : "Eliminar compra"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function MovimientosTable({
  movimientos,
  onChanged,
}: {
  movimientos: MovimientoConProducto[];
  onChanged: () => void;
}) {
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [editando, setEditando] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);

  const { grupos, sueltos } = useMemo(() => {
    const porCompra = new Map<string, MovimientoConProducto[]>();
    const sueltos: MovimientoConProducto[] = [];

    for (const m of movimientos) {
      if (m.tipo === "INGRESO" && m.compraId) {
        const arr = porCompra.get(m.compraId) ?? [];
        arr.push(m);
        porCompra.set(m.compraId, arr);
      } else {
        sueltos.push(m);
      }
    }

    const grupos: GrupoCompra[] = Array.from(porCompra.entries()).map(([compraId, lineas]) => ({
      compraId,
      fecha: lineas[0].fecha,
      motivo: lineas[0].motivo,
      lineas,
      total: lineas.reduce((s, l) => s + (l.costoUnitarioReal ?? 0) * l.cantidad, 0),
    }));

    return { grupos, sueltos };
  }, [movimientos]);

  const toggle = (compraId: string) => {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(compraId)) next.delete(compraId);
      else next.add(compraId);
      return next;
    });
  };

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Talle</TableHead>
            <TableHead className="text-right">Cant.</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead className="text-right">Costo unit.</TableHead>
            <TableHead className="text-right">Costo real</TableHead>
            <TableHead className="w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movimientos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                Sin movimientos registrados
              </TableCell>
            </TableRow>
          ) : (
            <>
              {grupos.map((g) => {
                const abierto = expandidos.has(g.compraId);
                return (
                  <Fragment key={g.compraId}>
                    <TableRow className="bg-muted/30 cursor-pointer" onClick={() => toggle(g.compraId)}>
                      <TableCell>
                        {abierto ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{formatearFecha(g.fecha)}</TableCell>
                      <TableCell>
                        <Badge className="text-xs">Ingreso</Badge>
                      </TableCell>
                      <TableCell colSpan={2} className="text-sm font-medium">
                        Compra · {g.lineas.length} línea{g.lineas.length !== 1 ? "s" : ""}
                      </TableCell>
                      <TableCell className="text-right text-sm">{g.lineas.reduce((s, l) => s + l.cantidad, 0)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{g.motivo}</TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right text-sm font-medium"><MonedaCell valor={g.total} /></TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditando(g.compraId)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => setEliminando(g.compraId)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {abierto && g.lineas.map((m) => (
                      <TableRow key={m.id} className="text-muted-foreground">
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-sm">{m.productoNombre}</TableCell>
                        <TableCell className="text-sm">{m.talle}</TableCell>
                        <TableCell className="text-right text-sm">{m.cantidad}</TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right text-sm"><MonedaCell valor={m.costoUnitarioCompra} /></TableCell>
                        <TableCell className="text-right text-sm"><MonedaCell valor={m.costoUnitarioReal} /></TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                );
              })}

              {sueltos.map((m) => (
                <TableRow key={m.id}>
                  <TableCell></TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{formatearFecha(m.fecha)}</TableCell>
                  <TableCell>
                    <Badge variant={m.tipo === "INGRESO" ? "default" : "destructive"} className="text-xs">
                      {m.tipo === "INGRESO" ? "Ingreso" : "Egreso"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{m.productoNombre}</TableCell>
                  <TableCell className="text-sm">{m.talle}</TableCell>
                  <TableCell className="text-right text-sm">{m.cantidad}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.motivo}</TableCell>
                  <TableCell className="text-right text-sm"><MonedaCell valor={m.costoUnitarioCompra} /></TableCell>
                  <TableCell className="text-right text-sm font-medium"><MonedaCell valor={m.costoUnitarioReal} /></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))}
            </>
          )}
        </TableBody>
      </Table>

      <EditarCompraDialog
        compraId={editando}
        open={editando !== null}
        onOpenChange={(v) => !v && setEditando(null)}
        onSuccess={onChanged}
      />
      <ConfirmarEliminarDialog
        compraId={eliminando}
        open={eliminando !== null}
        onOpenChange={(v) => !v && setEliminando(null)}
        onSuccess={onChanged}
      />
    </div>
  );
}
