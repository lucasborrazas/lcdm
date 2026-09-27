"use client";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MonedaCell } from "@/components/shared/MonedaCell";
import { formatearFecha } from "@/lib/calculations";
import type { MovimientoConProducto } from "@/lib/types";

export function MovimientosTable({ movimientos }: { movimientos: MovimientoConProducto[] }) {
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Período</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Talle</TableHead>
            <TableHead className="text-right">Cant.</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead className="text-right">Costo unit.</TableHead>
            <TableHead className="text-right">Costo real</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movimientos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                Sin movimientos registrados
              </TableCell>
            </TableRow>
          ) : (
            movimientos.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-sm whitespace-nowrap">
                  {formatearFecha(m.fecha)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{m.periodo}</TableCell>
                <TableCell>
                  <Badge variant={m.tipo === "INGRESO" ? "default" : "destructive"} className="text-xs">
                    {m.tipo === "INGRESO" ? "Ingreso" : "Egreso"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm font-medium">{m.productoNombre}</TableCell>
                <TableCell className="text-sm">{m.talle}</TableCell>
                <TableCell className="text-right text-sm">{m.cantidad}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{m.motivo}</TableCell>
                <TableCell className="text-right text-sm">
                  <MonedaCell valor={m.costoUnitarioCompra} />
                </TableCell>
                <TableCell className="text-right text-sm font-medium">
                  <MonedaCell valor={m.costoUnitarioReal} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
