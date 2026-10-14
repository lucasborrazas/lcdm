"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Pencil, Save, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MultiSelectFilter } from "@/components/shared/MultiSelectFilter";
import { SearchSelectFilter } from "@/components/shared/SearchSelectFilter";
import { formatearMoneda } from "@/lib/calculations";
import { colorHorario } from "@/lib/torneo";
import { montoBono, resumenPorTurno, type MetodoPago } from "@/lib/premios";
import { cn } from "@/lib/utils";
import { PILL_PAGO, PILL_SIN_PAGAR } from "@/lib/estilosEstado";
import type { EntregaConResumen, FamiliaConChicos, TurnoConConteo } from "@/lib/types";

function TurnoKpiCard({ turno, indice, alumnos, familias }: { turno: TurnoConConteo; indice: number; alumnos: number; familias: number }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {turno.hora}
          {turno.grupoEdad && ` — ${turno.grupoEdad.nombre}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{alumnos}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          alumnos · {familias} familia{familias === 1 ? "" : "s"}
          {!turno.activo && " · inactivo"}
        </p>
      </CardContent>
    </Card>
  );
}

function CeldaPago({
  familia,
  entrega,
  onCambiarPago,
  onEditarMonto,
}: {
  familia: FamiliaConChicos;
  entrega: EntregaConResumen | null;
  onCambiarPago: (metodo: MetodoPago | null) => void;
  onEditarMonto: (monto: number) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [monto, setMonto] = useState("");

  const guardar = () => {
    onEditarMonto(parseInt(monto) || 0);
    setEditando(false);
  };

  if (editando) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min="0"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && guardar()}
          className="h-7 w-24 text-sm"
          autoFocus
        />
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={guardar}>
          <Save className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditando(false)}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  const badge = familia.metodoPago ? (
    <Badge className={cn("text-xs font-normal", PILL_PAGO)}>
      {familia.metodoPago === "EFECTIVO" ? "Efectivo" : "Transferencia"} · {formatearMoneda(familia.monto)}
    </Badge>
  ) : (
    <Badge className={cn("text-xs font-normal", PILL_SIN_PAGAR)}>
      Sin pagar · {formatearMoneda(familia.monto)}
    </Badge>
  );

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button type="button" className="-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 hover:bg-muted">
              {badge}
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
          }
        />
        <DropdownMenuContent align="start">
          <DropdownMenuRadioGroup
            value={familia.metodoPago ?? "NO_PAGO"}
            onValueChange={(v) => onCambiarPago(v === "NO_PAGO" ? null : (v as MetodoPago))}
          >
            <DropdownMenuRadioItem value="NO_PAGO" closeOnClick>Sin pagar</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="EFECTIVO" closeOnClick>
              Efectivo{entrega && ` · ${formatearMoneda(montoBono(entrega, "EFECTIVO"))}`}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="TRANSFERENCIA" closeOnClick>
              Transferencia{entrega && ` · ${formatearMoneda(montoBono(entrega, "TRANSFERENCIA"))}`}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        title="Editar monto"
        onClick={() => {
          setMonto(familia.monto.toString());
          setEditando(true);
        }}
      >
        <Pencil className="h-3 w-3" />
      </Button>
    </div>
  );
}

// Escritorio de Inscripciones: mismo esquema que Torneo (cards por turno,
// filtros arriba y tabla con pago editable en la fila).
export function FamiliasTablaDesktop({
  entrega,
  turnos,
  familias,
  cargando,
  onEditar,
  onEliminar,
  onCambiarPago,
  onEditarMonto,
}: {
  entrega: EntregaConResumen | null;
  turnos: TurnoConConteo[];
  familias: FamiliaConChicos[];
  cargando: boolean;
  onEditar: (f: FamiliaConChicos) => void;
  onEliminar: (f: FamiliaConChicos) => void;
  onCambiarPago: (f: FamiliaConChicos, metodo: MetodoPago | null) => void;
  onEditarMonto: (f: FamiliaConChicos, monto: number) => void;
}) {
  const [filtroNombre, setFiltroNombre] = useState<string[]>([]);
  const [filtroTurno, setFiltroTurno] = useState<string[]>([]);

  const turnosVisibles = useMemo(
    () => turnos.filter((t) => t.activo || familias.some((f) => f.turnoId === t.id)),
    [turnos, familias]
  );
  const resumen = useMemo(() => resumenPorTurno(turnosVisibles.map((t) => t.id), familias), [turnosVisibles, familias]);
  const indiceTurno = useMemo(() => new Map(turnos.map((t, i) => [t.id, i])), [turnos]);

  const opcionesNombre = useMemo(
    () =>
      Array.from(new Set(familias.map((f) => f.nombre)))
        .sort((a, b) => a.localeCompare(b))
        .map((n) => ({ value: n, label: n })),
    [familias]
  );
  const opcionesTurno = useMemo(
    () => turnosVisibles.map((t) => ({ value: t.id, label: `${t.hora}${t.grupoEdad ? ` — ${t.grupoEdad.nombre}` : ""}` })),
    [turnosVisibles]
  );

  const filas = useMemo(
    () =>
      familias
        .filter(
          (f) =>
            (filtroNombre.length === 0 || filtroNombre.includes(f.nombre)) &&
            (filtroTurno.length === 0 || filtroTurno.includes(f.turnoId))
        )
        .sort(
          (a, b) =>
            (indiceTurno.get(a.turnoId) ?? 0) - (indiceTurno.get(b.turnoId) ?? 0) || a.nombre.localeCompare(b.nombre)
        ),
    [familias, filtroNombre, filtroTurno, indiceTurno]
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <SearchSelectFilter
          label="Familia"
          placeholder="Buscar familia..."
          options={opcionesNombre}
          selected={filtroNombre}
          onChange={setFiltroNombre}
          className="w-56"
        />
        <MultiSelectFilter
          label="Turno"
          placeholderTodos="Todos"
          options={opcionesTurno}
          selected={filtroTurno}
          onChange={setFiltroTurno}
          className="w-56"
        />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {turnosVisibles.map((t, i) => (
          <TurnoKpiCard key={t.id} turno={t} indice={indiceTurno.get(t.id) ?? i} alumnos={resumen[i].chicos} familias={resumen[i].familias} />
        ))}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Familia</TableHead>
              <TableHead>Alumnos</TableHead>
              <TableHead>Personas</TableHead>
              <TableHead>Turno</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargando ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Cargando...</TableCell>
              </TableRow>
            ) : filas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Sin inscripciones</TableCell>
              </TableRow>
            ) : (
              filas.map((f) => {
                const turno = turnos.find((t) => t.id === f.turnoId);
                const color = colorHorario(indiceTurno.get(f.turnoId) ?? 0);
                return (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">
                      {f.nombre}
                      {f.telefono && <span className="ml-2 text-xs font-normal text-muted-foreground">{f.telefono}</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {f.chicos.map((c) => (
                          <Badge
                            key={c.id}
                            className={cn(
                              "border-transparent text-xs font-normal",
                              c.genero === "MASCULINO" ? "bg-blue-500/15 text-blue-700" : "bg-pink-500/15 text-pink-700"
                            )}
                          >
                            {c.nombre}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{f.totalPersonas}</TableCell>
                    <TableCell>
                      <Badge className={cn("border-transparent text-xs font-normal", color.pill)}>
                        {turno?.hora}
                        {turno?.grupoEdad && ` — ${turno.grupoEdad.nombre}`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <CeldaPago
                        familia={f}
                        entrega={entrega}
                        onCambiarPago={(m) => onCambiarPago(f, m)}
                        onEditarMonto={(m) => onEditarMonto(f, m)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditar(f)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => confirm(`¿Eliminar a la familia ${f.nombre}?`) && onEliminar(f)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
