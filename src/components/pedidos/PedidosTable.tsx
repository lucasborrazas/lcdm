"use client";

import { useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";
import { MonedaCell } from "@/components/shared/MonedaCell";
import { BadgeEstadoPedido, BadgeEstadoPago } from "@/components/shared/BadgeEstado";
import { formatearFecha } from "@/lib/calculations";
import { PedidoEditDialog } from "./PedidoEditDialog";
import type { PedidoConProducto } from "@/lib/types";

export function PedidosTable({
  pedidos,
  onUpdate,
}: {
  pedidos: PedidoConProducto[];
  onUpdate: () => void;
}) {
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroEstadoPedido, setFiltroEstadoPedido] = useState("todos");
  const [filtroEstadoPago, setFiltroEstadoPago] = useState("todos");
  const [editando, setEditando] = useState<PedidoConProducto | null>(null);

  const filtrados = pedidos.filter((p) => {
    const matchCliente = p.cliente.toLowerCase().includes(filtroCliente.toLowerCase());
    const matchEstadoPedido = filtroEstadoPedido === "todos" || p.estadoPedido === filtroEstadoPedido;
    const matchEstadoPago = filtroEstadoPago === "todos" || p.estadoPago === filtroEstadoPago;
    return matchCliente && matchEstadoPedido && matchEstadoPago;
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Filtrar por cliente..."
          value={filtroCliente}
          onChange={(e) => setFiltroCliente(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filtroEstadoPedido} onValueChange={setFiltroEstadoPedido}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado pedido" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="POR_PEDIR">Por pedir</SelectItem>
            <SelectItem value="ENCARGADO">Encargado</SelectItem>
            <SelectItem value="ENTREGADO">Entregado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroEstadoPago} onValueChange={setFiltroEstadoPago}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado pago" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los pagos</SelectItem>
            <SelectItem value="PENDIENTE">Pendiente</SelectItem>
            <SelectItem value="SENA">Seña</SelectItem>
            <SelectItem value="PAGO">Pagado</SelectItem>
          </SelectContent>
        </Select>
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
                  <TableCell><BadgeEstadoPedido estado={p.estadoPedido} /></TableCell>
                  <TableCell><BadgeEstadoPago estado={p.estadoPago} /></TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditando(p)}
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
