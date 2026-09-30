"use client";

import { useState, type ReactNode } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Pencil, ChevronDown } from "lucide-react";
import { MonedaCell } from "@/components/shared/MonedaCell";
import { MultiSelectFilter } from "@/components/shared/MultiSelectFilter";
import { BadgeEstadoPedido, BadgeEstadoPago } from "@/components/shared/BadgeEstado";
import { formatearFecha } from "@/lib/calculations";
import { PedidoEditDialog } from "./PedidoEditDialog";
import type { PedidoConProducto } from "@/lib/types";

const ESTADOS_PEDIDO = [
  { value: "POR_PEDIR", label: "Por pedir" },
  { value: "ENCARGADO", label: "Encargado" },
  { value: "ENTREGADO", label: "Entregado" },
] as const;

const ESTADOS_PAGO = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "SENA", label: "Seña" },
  { value: "PAGO", label: "Pagado" },
] as const;

function EstadoDropdown({
  badge,
  opciones,
  valorActual,
  onSelect,
}: {
  badge: ReactNode;
  opciones: readonly { value: string; label: string }[];
  valorActual: string;
  onSelect: (valor: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded -mx-1 px-1 py-0.5 hover:bg-muted"
          >
            {badge}
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
        }
      />
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup value={valorActual} onValueChange={onSelect}>
          {opciones.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value} closeOnClick>
              {o.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PedidosTable({
  pedidos,
  onUpdate,
}: {
  pedidos: PedidoConProducto[];
  onUpdate: () => void;
}) {
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroEstadoPedido, setFiltroEstadoPedido] = useState<string[]>([]);
  const [filtroEstadoPago, setFiltroEstadoPago] = useState<string[]>([]);
  const [editando, setEditando] = useState<PedidoConProducto | null>(null);

  const cambiarEstado = async (
    id: string,
    campo: "estadoPedido" | "estadoPago",
    valor: string
  ) => {
    await fetch(`/api/pedidos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [campo]: valor }),
    });
    onUpdate();
  };

  const filtrados = pedidos.filter((p) => {
    const matchCliente = p.cliente.toLowerCase().includes(filtroCliente.toLowerCase());
    const matchEstadoPedido = filtroEstadoPedido.length === 0 || filtroEstadoPedido.includes(p.estadoPedido);
    const matchEstadoPago = filtroEstadoPago.length === 0 || filtroEstadoPago.includes(p.estadoPago);
    return matchCliente && matchEstadoPedido && matchEstadoPago;
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-56">
          <label className="text-xs text-muted-foreground mb-1 block">Cliente</label>
          <Input
            placeholder="Filtrar por cliente..."
            value={filtroCliente}
            onChange={(e) => setFiltroCliente(e.target.value)}
          />
        </div>
        <MultiSelectFilter
          label="Estado pedido"
          placeholderTodos="Todos"
          className="w-40"
          options={ESTADOS_PEDIDO.map((e) => ({ value: e.value, label: e.label }))}
          selected={filtroEstadoPedido}
          onChange={setFiltroEstadoPedido}
        />
        <MultiSelectFilter
          label="Estado pago"
          placeholderTodos="Todos"
          className="w-40"
          options={ESTADOS_PAGO.map((e) => ({ value: e.value, label: e.label }))}
          selected={filtroEstadoPago}
          onChange={setFiltroEstadoPago}
        />
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>T.</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead className="text-right">Cant.</TableHead>
              <TableHead className="text-right">Precio unit.</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Seña</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead>Est. pedido</TableHead>
              <TableHead>Est. pago</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                  Sin pedidos
                </TableCell>
              </TableRow>
            ) : (
              filtrados.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm whitespace-nowrap">{formatearFecha(p.fecha)}</TableCell>
                  <TableCell className="text-sm font-medium">{p.cliente}</TableCell>
                  <TableCell className="text-sm">{p.productoNombre}</TableCell>
                  <TableCell className="text-sm">{p.talle}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.metodoPago === "EFECTIVO" ? "Efec." : "Trans."}</TableCell>
                  <TableCell className="text-right text-sm">{p.cantidad}</TableCell>
                  <TableCell className="text-right text-sm"><MonedaCell valor={p.precioUnitario} /></TableCell>
                  <TableCell className="text-right text-sm font-medium"><MonedaCell valor={p.precioTotal} /></TableCell>
                  <TableCell className="text-right text-sm"><MonedaCell valor={p.sena > 0 ? p.sena : null} /></TableCell>
                  <TableCell className="text-right text-sm">
                    <span className={p.saldoRestante > 0 ? "text-amber-600" : "text-green-600"}>
                      <MonedaCell valor={p.saldoRestante} />
                    </span>
                  </TableCell>
                  <TableCell>
                    <EstadoDropdown
                      badge={<BadgeEstadoPedido estado={p.estadoPedido} />}
                      opciones={ESTADOS_PEDIDO}
                      valorActual={p.estadoPedido}
                      onSelect={(v) => cambiarEstado(p.id, "estadoPedido", v)}
                    />
                  </TableCell>
                  <TableCell>
                    <EstadoDropdown
                      badge={<BadgeEstadoPago estado={p.estadoPago} />}
                      opciones={ESTADOS_PAGO}
                      valorActual={p.estadoPago}
                      onSelect={(v) => cambiarEstado(p.id, "estadoPago", v)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditando(p)}
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PedidoEditDialog
        open={editando !== null}
        onOpenChange={(v) => { if (!v) setEditando(null); }}
        pedido={editando}
        onSuccess={() => { setEditando(null); onUpdate(); }}
      />
    </div>
  );
}
