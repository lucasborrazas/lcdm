"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  History,
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { MonedaCell } from "@/components/shared/MonedaCell";
import { ProductoDialog } from "./ProductoDialog";
import { PrecioDialog } from "./PrecioDialog";
import type { ProductoConStock } from "@/lib/types";

type Grupo = {
  key: string;
  temporada: string;
  genero: string;
  nombre: string;
  lineas: ProductoConStock[];
};

function agruparPorTipo(productos: ProductoConStock[]): Grupo[] {
  const grupos = new Map<string, Grupo>();
  for (const p of productos) {
    const key = `${p.temporada}|${p.genero}|${p.nombre}`;
    const existente = grupos.get(key);
    if (existente) {
      existente.lineas.push(p);
    } else {
      grupos.set(key, {
        key,
        temporada: p.temporada,
        genero: p.genero,
        nombre: p.nombre,
        lineas: [p],
      });
    }
  }
  return Array.from(grupos.values());
}

async function patchArchivado(id: string, archivado: boolean) {
  await fetch(`/api/productos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ archivado }),
  });
}

export function ProductosTable() {
  const [productos, setProductos] = useState<ProductoConStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [precioDialogOpen, setPrecioDialogOpen] = useState(false);
  const [editando, setEditando] = useState<ProductoConStock | null>(null);

  const [filtroEstado, setFiltroEstado] = useState("activos");
  const [filtroTemporada, setFiltroTemporada] = useState("todas");
  const [filtroGenero, setFiltroGenero] = useState("todos");
  const [filtroNombre, setFiltroNombre] = useState("todos");
  const [filtroTalle, setFiltroTalle] = useState("todos");
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  const cargarProductos = async () => {
    setLoading(true);
    const res = await fetch("/api/productos");
    const data = await res.json();
    setProductos(data);
    setLoading(false);
  };

  useEffect(() => { cargarProductos(); }, []);

  const nombres = useMemo(
    () => Array.from(new Set(productos.map((p) => p.nombre))).sort(),
    [productos]
  );
  const talles = useMemo(
    () => Array.from(new Set(productos.map((p) => p.talle))).sort(),
    [productos]
  );

  const filtrados = productos.filter((p) => {
    const matchEstado =
      filtroEstado === "todos" ||
      (filtroEstado === "activos" && !p.archivado) ||
      (filtroEstado === "archivados" && p.archivado);
    const matchTemporada = filtroTemporada === "todas" || p.temporada === filtroTemporada;
    const matchGenero = filtroGenero === "todos" || p.genero === filtroGenero;
    const matchNombre = filtroNombre === "todos" || p.nombre === filtroNombre;
    const matchTalle = filtroTalle === "todos" || p.talle === filtroTalle;
    return matchEstado && matchTemporada && matchGenero && matchNombre && matchTalle;
  });

  const grupos = agruparPorTipo(filtrados);

  const toggleExpandido = (key: string) => {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleEdit = (p: ProductoConStock) => {
    setEditando(p);
    setDialogOpen(true);
  };

  const handlePrecio = (p: ProductoConStock) => {
    setEditando(p);
    setPrecioDialogOpen(true);
  };

  const handleNuevo = () => {
    setEditando(null);
    setDialogOpen(true);
  };

  const handleToggleArchivado = async (p: ProductoConStock) => {
    await patchArchivado(p.id, !p.archivado);
    cargarProductos();
  };

  const handleToggleArchivadoGrupo = async (lineas: ProductoConStock[]) => {
    const archivarTodo = !lineas.every((p) => p.archivado);
    await Promise.all(lineas.map((p) => patchArchivado(p.id, archivarTodo)));
    cargarProductos();
  };

  const renderLinea = (p: ProductoConStock, indentado: boolean) => (
    <TableRow key={p.id} className={p.archivado ? "opacity-50" : undefined}>
      <TableCell>
        <Badge variant={p.temporada === "VERANO" ? "default" : "secondary"} className="text-xs">
          {p.temporada === "VERANO" ? "Verano" : "Invierno"}
        </Badge>
      </TableCell>
      <TableCell className="text-sm">
        {p.genero === "MASCULINO" ? "Masc." : "Fem."}
      </TableCell>
      <TableCell className={`font-medium text-sm ${indentado ? "pl-8" : ""}`}>
        {p.nombre}
      </TableCell>
      <TableCell className="text-sm">{p.talle}</TableCell>
      <TableCell className="text-right text-sm">
        <MonedaCell valor={p.costoActual} />
      </TableCell>
      <TableCell className="text-right text-sm">
        <MonedaCell valor={p.precioVenta} />
      </TableCell>
      <TableCell className="text-right text-sm">
        {p.gananciaUnitaria != null ? (
          <span className={p.gananciaUnitaria >= 0 ? "text-green-600" : "text-red-500"}>
            <MonedaCell valor={p.gananciaUnitaria} />
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <span
          className={
            p.stockMinimo != null && p.stockActual <= p.stockMinimo
              ? "text-red-500 font-semibold"
              : ""
          }
        >
          {p.stockActual}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePrecio(p)}
            title="Cambiar costo/precio"
          >
            <History className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleEdit(p)}
            title="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleToggleArchivado(p)}
            title={p.archivado ? "Restaurar" : "Archivar"}
          >
            {p.archivado ? (
              <ArchiveRestore className="h-3.5 w-3.5" />
            ) : (
              <Archive className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div>
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
        <Button onClick={handleNuevo} className="sm:ml-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo producto
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Temporada</TableHead>
              <TableHead>Género</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Talle</TableHead>
              <TableHead className="text-right">Costo</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Ganancia</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="w-[130px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : grupos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No hay productos
                </TableCell>
              </TableRow>
            ) : (
              grupos.flatMap((g) => {
                if (g.lineas.length === 1) {
                  return [renderLinea(g.lineas[0], false)];
                }

                const expandido = expandidos.has(g.key);
                const stockTotal = g.lineas.reduce((s, p) => s + p.stockActual, 0);
                const todasArchivadas = g.lineas.every((p) => p.archivado);

                const filaGrupo = (
                  <TableRow
                    key={g.key}
                    className={`cursor-pointer bg-muted/40 hover:bg-muted/60 ${todasArchivadas ? "opacity-50" : ""}`}
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
                    <TableCell className="text-right text-sm text-muted-foreground">—</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">—</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">—</TableCell>
                    <TableCell className="text-right text-sm font-medium">{stockTotal}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleArchivadoGrupo(g.lineas);
                        }}
                        title={todasArchivadas ? "Restaurar todos los talles" : "Archivar todos los talles"}
                      >
                        {todasArchivadas ? (
                          <ArchiveRestore className="h-3.5 w-3.5" />
                        ) : (
                          <Archive className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );

                if (!expandido) return [filaGrupo];
                return [filaGrupo, ...g.lineas.map((p) => renderLinea(p, true))];
              })
            )}
          </TableBody>
        </Table>
      </div>

      <ProductoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        producto={editando}
        onSuccess={() => { cargarProductos(); setDialogOpen(false); }}
      />

      <PrecioDialog
        open={precioDialogOpen}
        onOpenChange={setPrecioDialogOpen}
        producto={editando}
        onSuccess={() => { cargarProductos(); setPrecioDialogOpen(false); }}
      />
    </div>
  );
}
