"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Pencil, ChevronDown, ChevronRight } from "lucide-react";
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

  const [filtroEstado, setFiltroEstado] = useState("activos");
  const [filtroTemporada, setFiltroTemporada] = useState("todas");
  const [filtroGenero, setFiltroGenero] = useState("todos");
  const [filtroNombre, setFiltroNombre] = useState("todos");
  const [filtroTalle, setFiltroTalle] = useState("todos");
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
    const matchEstado =
      filtroEstado === "todos" ||
      (filtroEstado === "activos" && !s.archivado) ||
      (filtroEstado === "archivados" && s.archivado);
    const matchTemporada = filtroTemporada === "todas" || s.temporada === filtroTemporada;
    const matchGenero = filtroGenero === "todos" || s.genero === filtroGenero;
    const matchNombre = filtroNombre === "todos" || s.nombre === filtroNombre;
    const matchTalle = filtroTalle === "todos" || s.talle === filtroTalle;
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

      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="activos">Activos</SelectItem>
            <SelectItem value="archivados">Archivados</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroTemporada} onValueChange={setFiltroTemporada}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Temporada" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Toda temporada</SelectItem>
            <SelectItem value="VERANO">Verano</SelectItem>
            <SelectItem value="INVIERNO">Invierno</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroGenero} onValueChange={setFiltroGenero}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Género" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todo género</SelectItem>
            <SelectItem value="MASCULINO">Masculino</SelectItem>
            <SelectItem value="FEMENINO">Femenino</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroNombre} onValueChange={setFiltroNombre}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Producto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todo producto</SelectItem>
            {nombres.map((n) => (
              <SelectItem key={n} value={n}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroTalle} onValueChange={setFiltroTalle}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Talle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todo talle</SelectItem>
            {talles.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
