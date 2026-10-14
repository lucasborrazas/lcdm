"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { MonedaCell } from "@/components/shared/MonedaCell";
import { formatearFecha } from "@/lib/calculations";
import type { HistorialConProducto, PedidoEliminado } from "@/lib/types";

export default function HistorialPage() {
  const [historial, setHistorial] = useState<HistorialConProducto[]>([]);
  const [pedidosEliminados, setPedidosEliminados] = useState<PedidoEliminado[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    fetch("/api/historial")
      .then((r) => r.json())
      .then((d) => { setHistorial(d); setLoading(false); });
    fetch("/api/pedidos-eliminados")
      .then((r) => r.json())
      .then(setPedidosEliminados);
  }, []);

  const items = historial.filter((h) => {
    const q = filtro.toLowerCase();
    return (
      h.productoNombre.toLowerCase().includes(q) ||
      h.motivo.toLowerCase().includes(q) ||
      h.talle.toLowerCase().includes(q)
    );
  });

  const eliminados = pedidosEliminados.filter((p) => {
    const q = filtro.toLowerCase();
    return (
      p.productoNombre.toLowerCase().includes(q) ||
      p.cliente.toLowerCase().includes(q) ||
      p.talle.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <PageHeader
        title="Historial de precios"
        description="Registro de todos los cambios de costo y precio de venta"
      />

      <Input
        placeholder="Filtrar por producto, cliente, motivo..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="max-w-sm mb-4"
      />

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Talle</TableHead>
              <TableHead className="text-right">Costo ant.</TableHead>
              <TableHead className="text-right">Costo nuevo</TableHead>
              <TableHead className="text-right">Precio ant.</TableHead>
              <TableHead className="text-right">Precio nuevo</TableHead>
              <TableHead>Motivo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Cargando...</TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Sin cambios registrados
                </TableCell>
              </TableRow>
            ) : (
              items.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="text-sm whitespace-nowrap">{formatearFecha(h.fecha)}</TableCell>
                  <TableCell className="text-sm font-medium">{h.productoNombre}</TableCell>
                  <TableCell className="text-sm">{h.talle}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    <MonedaCell valor={h.costoAnterior} />
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    <span className={h.costoNuevo > h.costoAnterior ? "text-red-500" : h.costoNuevo < h.costoAnterior ? "text-green-600" : ""}>
                      <MonedaCell valor={h.costoNuevo} />
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    <MonedaCell valor={h.precioAnterior} />
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    <MonedaCell valor={h.precioNuevo} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{h.motivo}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <h2 className="text-base font-semibold mt-8 mb-3">Pedidos eliminados</h2>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Eliminado el</TableHead>
              <TableHead>Fecha pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Talle</TableHead>
              <TableHead className="text-right">Cant.</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Estado pedido</TableHead>
              <TableHead>Estado pago</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eliminados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Sin pedidos eliminados
                </TableCell>
              </TableRow>
            ) : (
              eliminados.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm whitespace-nowrap">{formatearFecha(p.eliminadoEn)}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap text-muted-foreground">{formatearFecha(p.fecha)}</TableCell>
                  <TableCell className="text-sm font-medium">{p.cliente}</TableCell>
                  <TableCell className="text-sm">{p.productoNombre}</TableCell>
                  <TableCell className="text-sm">{p.talle}</TableCell>
                  <TableCell className="text-right text-sm">{p.cantidad}</TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    <MonedaCell valor={p.precioTotal} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.estadoPedido}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.estadoPago}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
