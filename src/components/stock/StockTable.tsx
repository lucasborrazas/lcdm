"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Pencil, ChevronDown, ChevronRight } from "lucide-react";
import { MultiSelectFilter } from "@/components/shared/MultiSelectFilter";
import { StockEditDialog } from "./StockEditDialog";
import type { StockResumen } from "@/lib/types";

type Grupo = {
  key: string;
  temporada: string;
  genero: string;
  nombre: string;
  lineas: StockResumen[];
};

function agruparPorTipo(items: StockResumen[]): Grupo[] {
  const grupos = new Map<string, Grupo>();
  for (const s of items) {
    const key = `${s.temporada}|${s.genero}|${s.nombre}`;
    const existente = grupos.get(key);
    if (existente) {
      existente.lineas.push(s);
    } else {
      grupos.set(key, {
        key,
        temporada: s.temporada,
        genero: s.genero,
        nombre: s.nombre,
        lineas: [s],
      });
    }
  }
  return Array.from(grupos.values());
}

export function StockTable() {
  const [stock, setStock] = useState<StockResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<StockResumen | null>(null);

  const [filtroEstado, setFiltroEstado] = useState<string[]>(["activos"]);
  const [filtroTemporada, setFiltroTemporada] = useState<string[]>([]);
  const [filtroGenero, setFiltroGenero] = useState<string[]>([]);
  const [filtroNombre, setFiltroNombre] = useState<string[]>([]);
  const [filtroTalle, setFiltroTalle] = useState<string[]>([]);
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  const cargar = () => {
    setLoading(true);
    fetch("/api/stock")
      .then((r) => r.json())
      .then((d) => { setStock(d); setLoading(false); });
  };

  useEffect(() => { cargar(); }, []);

  const nombres = useMemo(
    () => Array.from(new Set(stock.map((s) => s.nombre))).sort(),
    [stock]
  );
  const talles = useMemo(
    () => Array.from(new Set(stock.map((s) => s.talle))).sort(),
    [stock]
  );

  const items = stock.filter((s) => {
    const estadoS = s.archivado ? "archivados" : "activos";
    const matchEstado = filtroEstado.length === 0 || filtroEstado.includes(estadoS);
    const matchTemporada = filtroTemporada.length === 0 || filtroTemporada.includes(s.temporada);
    const matchGenero = filtroGenero.length === 0 || filtroGenero.includes(s.genero);
    const matchNombre = filtroNombre.length === 0 || filtroNombre.includes(s.nombre);
    const matchTalle = filtroTalle.length === 0 || filtroTalle.includes(s.talle);
    return matchEstado && matchTemporada && matchGenero && matchNombre && matchTalle;
  });

  const bajos = items.filter((s) => s.stockBajo);
  const grupos = agruparPorTipo(items);

  const toggleExpandido = (key: string) => {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderLinea = (s: StockResumen, indentado: boolean) => (
    <TableRow key={s.productoId} className={s.stockBajo ? "bg-red-50" : s.archivado ? "opacity-50" : undefined}>
      <TableCell>
        <Badge variant={s.temporada === "VERANO" ? "default" : "secondary"} className="text-xs">
          {s.temporada === "VERANO" ? "Verano" : "Invierno"}
        </Badge>
      </TableCell>
      <TableCell className="text-sm">{s.genero === "MASCULINO" ? "Masc." : "Fem."}</TableCell>
      <TableCell className={`font-medium text-sm ${indentado ? "pl-8" : ""}`}>{s.nombre}</TableCell>
      <TableCell className="text-sm">{s.talle}</TableCell>
      <TableCell className="text-right text-sm font-medium">{s.stockInicial}</TableCell>
      <TableCell className="text-right text-sm text-green-600">{s.ingresos > 0 ? `+${s.ingresos}` : 0}</TableCell>
      <TableCell className="text-right text-sm text-red-500">{s.egresos > 0 ? `-${s.egresos}` : 0}</TableCell>
      <TableCell className="text-right font-semibold">
        <span className={s.stockBajo ? "text-red-600" : ""}>
          {s.stockBajo && <AlertTriangle className="inline h-3 w-3 mr-1 text-red-500" />}
          {s.stockActual}
        </span>
      </TableCell>
      <TableCell className="text-right text-sm text-muted-foreground">
        {s.alertaMinimo != null && s.alertaMinimo > 0 ? s.alertaMinimo : "—"}
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setEditando(s)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  );

  return (
    <div>
      {bajos.length > 0 && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{bajos.length} producto{bajos.length > 1 ? "s" : ""} con stock bajo el mínimo</span>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <MultiSelectFilter
          label="Estado"
          placeholderTodos="Todos"
          className="w-36"
          options={[
            { value: "activos", label: "Activos" },
            { value: "archivados", label: "Archivados" },
          ]}
          selected={filtroEstado}
          onChange={setFiltroEstado}
        />
        <MultiSelectFilter
          label="Temporada"
          placeholderTodos="Todas"
          className="w-36"
          options={[
            { value: "VERANO", label: "Verano" },
            { value: "INVIERNO", label: "Invierno" },
          ]}
          selected={filtroTemporada}
          onChange={setFiltroTemporada}
        />
        <MultiSelectFilter
          label="Género"
          placeholderTodos="Todos"
          className="w-36"
          options={[
            { value: "MASCULINO", label: "Masculino" },
            { value: "FEMENINO", label: "Femenino" },
          ]}
          selected={filtroGenero}
          onChange={setFiltroGenero}
        />
        <MultiSelectFilter
          label="Producto"
          placeholderTodos="Todos"
          className="w-44"
          options={nombres.map((n) => ({ value: n, label: n }))}
          selected={filtroNombre}
          onChange={setFiltroNombre}
        />
        <MultiSelectFilter
          label="Talle"
          placeholderTodos="Todos"
          className="w-32"
          options={talles.map((t) => ({ value: t, label: t }))}
          selected={filtroTalle}
          onChange={setFiltroTalle}
        />
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Temporada</TableHead>
              <TableHead>Género</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Talle</TableHead>
              <TableHead className="text-right">Inicial</TableHead>
              <TableHead className="text-right">Ingresos</TableHead>
              <TableHead className="text-right">Egresos</TableHead>
              <TableHead className="text-right">Actual</TableHead>
              <TableHead className="text-right">Mín.</TableHead>
              <TableHead className="w-[48px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Cargando...</TableCell>
              </TableRow>
            ) : grupos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Sin resultados</TableCell>
              </TableRow>
            ) : (
              grupos.flatMap((g) => {
                if (g.lineas.length === 1) {
                  return [renderLinea(g.lineas[0], false)];
                }

                const expandido = expandidos.has(g.key);
                const stockActualTotal = g.lineas.reduce((s, l) => s + l.stockActual, 0);
                const stockInicialTotal = g.lineas.reduce((s, l) => s + l.stockInicial, 0);
                const algunoBajo = g.lineas.some((l) => l.stockBajo);
                const todosArchivados = g.lineas.every((l) => l.archivado);

                const filaGrupo = (
                  <TableRow
                    key={g.key}
                    className={`cursor-pointer bg-muted/40 hover:bg-muted/60 ${todosArchivados ? "opacity-50" : ""}`}
                    onClick={() => toggleExpandido(g.key)}
                  >
                    <TableCell>
                      <Badge variant={g.temporada === "VERANO" ? "default" : "secondary"} className="text-xs">
                        {g.temporada === "VERANO" ? "Verano" : "Invierno"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {g.genero === "MASCULINO" ? "Masc." : "Fem."}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      <div className="flex items-center gap-1.5">
                        {expandido ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        )}
                        {g.nombre}
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {g.lineas.length} talles
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">Varios</TableCell>
                    <TableCell className="text-right text-sm font-medium">{stockInicialTotal}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">—</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">—</TableCell>
                    <TableCell className="text-right font-semibold">
                      <span className={algunoBajo ? "text-red-600" : ""}>
                        {algunoBajo && <AlertTriangle className="inline h-3 w-3 mr-1 text-red-500" />}
                        {stockActualTotal}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">—</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                );

                if (!expandido) return [filaGrupo];
                return [filaGrupo, ...g.lineas.map((s) => renderLinea(s, true))];
              })
            )}
          </TableBody>
        </Table>
      </div>

      <StockEditDialog
        open={editando !== null}
        onOpenChange={(v) => { if (!v) setEditando(null); }}
        item={editando}
        onSuccess={() => { setEditando(null); cargar(); }}
      />
    </div>
  );
}
