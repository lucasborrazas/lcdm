"use client";

import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NOMBRES_MESES, nombreTorneo } from "@/lib/torneo";
import type { TorneoConResumen } from "@/lib/types";

function proximoMesAnio(torneos: TorneoConResumen[]): { mes: number; anio: number } {
  if (torneos.length === 0) {
    const hoy = new Date();
    return { mes: hoy.getMonth() + 1, anio: hoy.getFullYear() };
  }
  const ultimo = torneos[0];
  return ultimo.mes === 12
    ? { mes: 1, anio: ultimo.anio + 1 }
    : { mes: ultimo.mes + 1, anio: ultimo.anio };
}

export function NuevoTorneoDialog({
  open,
  onOpenChange,
  torneos,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  torneos: TorneoConResumen[];
  onCreated: (id: string) => void;
}) {
  const [mes, setMes] = useState(1);
  const [anio, setAnio] = useState(2026);
  const [duplicarDesde, setDuplicarDesde] = useState<string>("ninguno");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (open) {
      const sugerido = proximoMesAnio(torneos);
      setMes(sugerido.mes);
      setAnio(sugerido.anio);
      setDuplicarDesde(torneos[0]?.id ?? "ninguno");
      setError(null);
    }
  }, [open, torneos]);

  const crear = async () => {
    setGuardando(true);
    setError(null);
    const res = await fetch("/api/torneo/torneos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mes,
        anio,
        duplicarDesdeTorneoId: duplicarDesde !== "ninguno" ? duplicarDesde : undefined,
      }),
    });
    setGuardando(false);
    if (res.ok) {
      const data = await res.json();
      onOpenChange(false);
      onCreated(data.id);
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "No se pudo crear el torneo");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nuevo torneo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Mes</label>
              <Select value={mes.toString()} onValueChange={(v) => setMes(parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NOMBRES_MESES.map((nombre, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>{nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Año</label>
              <Input type="number" value={anio} onChange={(e) => setAnio(parseInt(e.target.value) || anio)} />
            </div>
          </div>

          {torneos.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Duplicar horarios de</label>
              <Select value={duplicarDesde} onValueChange={setDuplicarDesde}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ninguno">No duplicar (empezar vacío)</SelectItem>
                  {torneos.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{nombreTorneo(t.mes, t.anio)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={crear} disabled={guardando}>
              {guardando ? "Creando..." : "Crear torneo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
