"use client";

import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { nombreTorneo } from "@/lib/torneo";
import type { TorneoConResumen } from "@/lib/types";

export function TorneoSwitcher({
  torneos,
  torneoId,
  onSelect,
}: {
  torneos: TorneoConResumen[];
  torneoId: string | undefined;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">Torneo</label>
      <Select value={torneoId} onValueChange={onSelect}>
        <SelectTrigger className="w-56">
          <SelectValue placeholder="Elegir torneo..." />
        </SelectTrigger>
        <SelectContent>
          {torneos.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {nombreTorneo(t.mes, t.anio)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
