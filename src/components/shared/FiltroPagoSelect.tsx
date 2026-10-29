"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OPCIONES_FILTRO_PAGO, type FiltroPago } from "@/lib/filtroPago";

// Filtro de escritorio Todos / Sin pagar / Pagaron, con la cantidad de cada opcion.
export function FiltroPagoSelect({
  value,
  onChange,
  contadores,
}: {
  value: FiltroPago;
  onChange: (v: FiltroPago) => void;
  contadores: Record<FiltroPago, number>;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">Pago</label>
      <Select value={value} onValueChange={(v) => v && onChange(v as FiltroPago)}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPCIONES_FILTRO_PAGO.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label} ({contadores[o.value]})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
