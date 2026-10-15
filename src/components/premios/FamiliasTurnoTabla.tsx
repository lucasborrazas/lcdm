"use client";

import { useState } from "react";
import { ChevronDown, Pencil, Save, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatearMoneda } from "@/lib/calculations";
import { montoBono, type MetodoPago } from "@/lib/premios";
import { PILL_PAGO, PILL_SIN_PAGAR } from "@/lib/estilosEstado";
import { cn } from "@/lib/utils";
import type { EntregaConResumen, FamiliaConChicos } from "@/lib/types";

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

// Escritorio: familias de un turno en tabla, como en Torneo. Todos los datos
// se ven en la fila; tocar la fila abre la edicion completa.
export function FamiliasTurnoTabla({
  entrega,
  familias,
  onEditar,
  onEliminar,
  onCambiarPago,
  onEditarMonto,
}: {
  entrega: EntregaConResumen | null;
  familias: FamiliaConChicos[];
  onEditar: (f: FamiliaConChicos) => void;
  onEliminar: (f: FamiliaConChicos) => void;
  onCambiarPago: (f: FamiliaConChicos, metodo: MetodoPago | null) => void;
  onEditarMonto: (f: FamiliaConChicos, monto: number) => void;
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Familia</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Alumnos</TableHead>
            <TableHead className="text-center">Personas</TableHead>
            <TableHead>Pago</TableHead>
            <TableHead className="w-24"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {familias.map((f) => (
            <TableRow key={f.id}>
              <TableCell className="font-medium">
                <button type="button" onClick={() => onEditar(f)} className="text-left hover:underline">
                  {f.nombre}
                </button>
              </TableCell>
              <TableCell className="text-muted-foreground">{f.telefono || "—"}</TableCell>
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
              <TableCell className="text-center">{f.totalPersonas}</TableCell>
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
