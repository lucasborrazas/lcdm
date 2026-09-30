"use client";

import { useState, type ReactNode } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Pencil, ChevronDown, ChevronRight } from "lucide-react";
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

type Grupo = {
  key: string;
  lineas: PedidoConProducto[];
};

function agruparPedidos(pedidos: PedidoConProducto[]): (PedidoConProducto | Grupo)[] {
  const resultado: (PedidoConProducto | Grupo)[] = [];
  const gruposPorId = new Map<string, Grupo>();

  for (const p of pedidos) {
    if (!p.pedidoGrupoId) {
      resultado.push(p);
      continue;
    }
    const existente = gruposPorId.get(p.pedidoGrupoId);
    if (existente) {
      existente.lineas.push(p);
    } else {
      const grupo: Grupo = { key: p.pedidoGrupoId, lineas: [p] };
      gruposPorId.set(p.pedidoGrupoId, grupo);
      resultado.push(grupo);
    }
  }

  return resultado;
}

function esGrupo(item: PedidoConProducto | Grupo): item is Grupo {
  return "lineas" in item;
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
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  const cambiarEstadoPedido = async (id: string, valor: string) => {
    await fetch(`/api/pedidos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estadoPedido: valor }),
    });
    onUpdate();
  };

  const cambiarEstadoPago = async (p: PedidoConProducto, valor: string) => {
    if (p.pedidoGrupoId) {
      await fetch(`/api/pedidos-grupo/${p.pedidoGrupoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estadoPago: valor }),
      });
    } else {
      await fetch(`/api/pedidos/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estadoPago: valor }),
      });
    }
    onUpdate();
  };

  const toggleExpandido = (key: string) => {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filtrados = pedidos.filter((p) => {
    const matchCliente = p.cliente.toLowerCase().includes(filtroCliente.toLowerCase());
    const matchEstadoPedido = filtroEstadoPedido.length === 0 || filtroEstadoPedido.includes(p.estadoPedido);
    const estadoPagoEfectivo = p.pedidoGrupo?.estadoPago ?? p.estadoPago;
    const matchEstadoPago = filtroEstadoPago.length === 0 || filtroEstadoPago.includes(estadoPagoEfectivo);
    return matchCliente && matchEstadoPedido && matchEstadoPago;
  });

  const items = agruparPedidos(filtrados);

  const renderLinea = (p: PedidoConProducto, indentado: boolean) => {
    const sena = p.pedidoGrupo ? p.pedidoGrupo.sena : p.sena;
    const saldoRestante = p.pedidoGrupo ? p.pedidoGrupo.saldoRestante : p.saldoRestante;
    const estadoPago = p.pedidoGrupo ? p.pedidoGrupo.estadoPago : p.estadoPago;

    return (
      <TableRow key={p.id}>
        <TableCell className="text-sm whitespace-nowrap">{formatearFecha(p.fecha)}</TableCell>
        <TableCell className={`text-sm font-medium ${indentado ? "pl-8" : ""}`}>{indentado ? "" : p.cliente}</TableCell>
        <TableCell className="text-sm">{p.productoNombre}</TableCell>
        <TableCell className="text-sm">{p.talle}</TableCell>
        <TableCell className="text-xs text-muted-foreground">{p.metodoPago === "EFECTIVO" ? "Efec." : "Trans."}</TableCell>
        <TableCell className="text-right text-sm">{p.cantidad}</TableCell>
        <TableCell className="text-right text-sm"><MonedaCell valor={p.precioUnitario} /></TableCell>
        <TableCell className="text-right text-sm font-medium"><MonedaCell valor={p.precioTotal} /></TableCell>
        <TableCell className="text-right text-sm">
          {indentado ? <span className="text-muted-foreground">—</span> : <MonedaCell valor={sena > 0 ? sena : null} />}
        </TableCell>
        <TableCell className="text-right text-sm">
          {indentado ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <span className={saldoRestante > 0 ? "text-amber-600" : "text-green-600"}>
              <MonedaCell valor={saldoRestante} />
            </span>
          )}
        </TableCell>
        <TableCell>
          <EstadoDropdown
            badge={<BadgeEstadoPedido estado={p.estadoPedido} />}
            opciones={ESTADOS_PEDIDO}
            valorActual={p.estadoPedido}
            onSelect={(v) => cambiarEstadoPedido(p.id, v)}
          />
        </TableCell>
        <TableCell>
          {indentado ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <EstadoDropdown
              badge={<BadgeEstadoPago estado={estadoPago} />}
              opciones={ESTADOS_PAGO}
              valorActual={estadoPago}
              onSelect={(v) => cambiarEstadoPago(p, v)}
            />
          )}
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
    );
  };

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
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                  Sin pedidos
                </TableCell>
              </TableRow>
            ) : (
              items.flatMap((item) => {
                if (!esGrupo(item)) {
                  return [renderLinea(item, false)];
                }

                if (item.lineas.length === 1) {
                  return [renderLinea(item.lineas[0], false)];
                }

                const primera = item.lineas[0];
                const grupo = primera.pedidoGrupo!;
                const expandido = expandidos.has(item.key);

                const filaGrupo = (
                  <TableRow
                    key={item.key}
                    className="cursor-pointer bg-muted/40 hover:bg-muted/60"
                    onClick={() => toggleExpandido(item.key)}
                  >
                    <TableCell className="text-sm whitespace-nowrap">{formatearFecha(grupo.fecha)}</TableCell>
                    <TableCell className="font-medium text-sm">
                      <div className="flex items-center gap-1.5">
                        {expandido ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        )}
                        {grupo.cliente}
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {item.lineas.length} productos
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground" colSpan={2}>Varios</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{grupo.metodoPago === "EFECTIVO" ? "Efec." : "Trans."}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">—</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">—</TableCell>
                    <TableCell className="text-right text-sm font-medium"><MonedaCell valor={grupo.precioTotal} /></TableCell>
                    <TableCell className="text-right text-sm"><MonedaCell valor={grupo.sena > 0 ? grupo.sena : null} /></TableCell>
                    <TableCell className="text-right text-sm">
                      <span className={grupo.saldoRestante > 0 ? "text-amber-600" : "text-green-600"}>
                        <MonedaCell valor={grupo.saldoRestante} />
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">Ver detalle</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <EstadoDropdown
                        badge={<BadgeEstadoPago estado={grupo.estadoPago} />}
                        opciones={ESTADOS_PAGO}
                        valorActual={grupo.estadoPago}
                        onSelect={(v) => cambiarEstadoPago(primera, v)}
                      />
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                );

                if (!expandido) return [filaGrupo];
                return [filaGrupo, ...item.lineas.map((p) => renderLinea(p, true))];
              })
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
