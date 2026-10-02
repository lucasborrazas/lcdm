"use client";

import { Badge } from "@/components/ui/badge";
import { labelEstadoTorneo } from "@/lib/torneo";
import type { TorneoConResumen } from "@/lib/types";

export function EstadoTorneoBadge({ torneo }: { torneo: TorneoConResumen | null | undefined }) {
  if (!torneo) return null;

  return (
    <Badge variant={torneo.estado === "FINALIZADO" ? "outline" : "secondary"} className="mb-2">
      {labelEstadoTorneo(torneo.estado)}
    </Badge>
  );
}
