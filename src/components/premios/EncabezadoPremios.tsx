"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import type { EntregaConResumen } from "@/lib/types";
import { NuevaEntregaModal } from "./NuevaEntregaModal";

export type FiltroTurno = {
  turnos: { id: string; hora: string; grupoEdad?: { nombre: string } | null }[];
  value: string;
  onChange: (id: string) => void;
};

type Selector = {
  entregas: EntregaConResumen[];
  entregaId: string | undefined;
  onSelect: (id: string) => void;
};

function EntregaSwitcher({ entregas, entregaId, onSelect }: Selector) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">Año</label>
      <Select value={entregaId} onValueChange={(v) => v && onSelect(v)}>
        <SelectTrigger className="w-56">
          <SelectValue placeholder="Elegir año..." />
        </SelectTrigger>
        <SelectContent>
          {entregas.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.anio}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Pill "2026 ▾": abre una hoja para elegir la entrega (mobile).
function EntregaPill({ entregas, entregaId, onSelect }: Selector) {
  const [abierto, setAbierto] = useState(false);
  const actual = entregas.find((e) => e.id === entregaId);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex h-9 items-center gap-1.5 rounded-full bg-muted px-3 text-[13px] font-semibold"
      >
        {actual ? actual.anio : "Año"}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      <BottomSheet open={abierto} onOpenChange={setAbierto} title="Elegir año">
        <div className="space-y-1.5">
          {entregas.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => {
                onSelect(e.id);
                setAbierto(false);
              }}
              className={cn(
                "flex min-h-14 w-full items-center rounded-xl px-4 text-left text-[15px] font-semibold",
                e.id === entregaId ? "bg-[hsl(209_65%_95%)] ring-2 ring-primary" : "bg-muted/60"
              )}
            >
              {e.anio}
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}

// Titulo de cada pantalla de Entrega de premios: en mobile el MobileHeader con
// la pill del año; en escritorio el PageHeader y el selector de entrega.
export function EncabezadoPremios({
  titulo,
  descripcion,
  entregas,
  entregaId,
  onSelect,
  acciones,
  filtroTurno,
}: Selector & {
  titulo: string;
  descripcion: string;
  acciones?: React.ReactNode;
  // Escritorio: selector de turno al lado del de año ("all" = todos).
  filtroTurno?: FiltroTurno;
}) {
  return (
    <>
      <MobileHeader
        seccion="pre"
        title={titulo}
        pill={entregas.length > 0 ? <EntregaPill entregas={entregas} entregaId={entregaId} onSelect={onSelect} /> : undefined}
      />
      <div className="hidden md:block">
        <PageHeader title={`${titulo} — Entrega de premios`} description={descripcion} />
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            {entregas.length > 0 ? <EntregaSwitcher entregas={entregas} entregaId={entregaId} onSelect={onSelect} /> : <div />}
            {filtroTurno && (
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Turno</label>
                <Select value={filtroTurno.value} onValueChange={(v) => v && filtroTurno.onChange(v)}>
                  <SelectTrigger className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los turnos</SelectItem>
                    {filtroTurno.turnos.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.hora}
                        {t.grupoEdad && ` — ${t.grupoEdad.nombre}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {acciones && <div className="flex gap-2">{acciones}</div>}
        </div>
      </div>
    </>
  );
}

// Cuando todavia no hay ninguna entrega cargada.
export function SinEntrega({
  entregas,
  onCreada,
}: {
  entregas: EntregaConResumen[];
  onCreada: (id: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="rounded-[14px] border border-dashed px-4 py-10 text-center">
      <p className="text-[15px] font-semibold">Todavía no hay una entrega de premios</p>
      <p className="mt-1 text-sm text-muted-foreground">Se crea con los turnos de siempre y después los ajustás.</p>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="mx-auto mt-4 flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-[15px] font-semibold text-primary-foreground"
      >
        <Plus className="h-4 w-4" />
        Nueva entrega
      </button>
      <NuevaEntregaModal open={abierto} onOpenChange={setAbierto} entregas={entregas} onCreada={onCreada} />
    </div>
  );
}
