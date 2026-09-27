"use client";

import { useState, useEffect } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Pencil } from "lucide-react";
import { StockEditDialog } from "./StockEditDialog";
import type { StockResumen } from "@/lib/types";

export function StockTable() {
  const [stock, setStock] = useState<StockResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [editando, setEditando] = useState<StockResumen | null>(null);

  const cargar = () => {
    setLoading(true);
    fetch("/api/stock")
      .then((r) => r.json())
      .then((d) => { setStock(d); setLoading(false); });
  };

  useEffect(() => { cargar(); }, []);

  const items = stock.filter((s) => {
    const q = filtro.toLowerCase();
    return (
      s.nombre.toLowerCase().includes(q) ||
      s.talle.toLowerCase().includes(q) ||
      s.temporada.toLowerCase().includes(q) ||
      s.genero.toLowerCase().includes(q)
    );
  });

  const bajos = items.filter((s) => s.stockBajo);

  return (
    <div>
      {bajos.length > 0 && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{bajos.length} producto{bajos.length > 1 ? "s" : ""} con stock bajo el mínimo</span>
        </div>
      )}

      <Input
        placeholder="Filtrar por nombre, talle, temporada..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="max-w-sm mb-4"
      />

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
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Sin resultados</TableCell>
              </TableRow>
            ) : (
              items.map((s) => (
                <TableRow key={s.productoId} className={s.stockBajo ? "bg-red-50" : ""}>
                  <TableCell>
                    <Badge variant={s.temporada === "VERANO" ? "default" : "secondary"} className="text-xs">
                      {s.temporada === "VERANO" ? "Verano" : "Invierno"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{s.genero === "MASCULINO" ? "Masc." : "Fem."}</TableCell>
                  <TableCell className="font-medium text-sm">{s.nombre}</TableCell>
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
              ))
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
