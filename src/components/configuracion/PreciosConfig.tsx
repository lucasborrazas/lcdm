"use client";

import { useState } from "react";
import { EtiquetaSeccion } from "@/components/mobile/ui";
import { formatearMoneda } from "@/lib/calculations";
import { precioEfectivoDesde } from "@/lib/premios";
import type { PreciosConfig } from "@/lib/preciosConfig";

const campo = "h-12 w-full rounded-xl bg-muted px-3 text-[15px] outline-none md:h-8 md:rounded-lg md:border md:border-input md:bg-transparent md:px-2.5 md:py-1 md:text-sm md:focus-visible:border-ring md:focus-visible:ring-3 md:focus-visible:ring-ring/50";

export function FormPrecios({
  seccion,
  precios,
  onGuardado,
}: {
  seccion: "TORNEO" | "PREMIOS";
  precios: PreciosConfig;
  onGuardado: () => void;
}) {
  const [torneoEfectivo, setTorneoEfectivo] = useState(precios.torneoEfectivo.toString());
  const [torneoTransferencia, setTorneoTransferencia] = useState(precios.torneoTransferencia.toString());
  const [bonoTransferencia, setBonoTransferencia] = useState(precios.bonoTransferencia.toString());
  const [descuento, setDescuento] = useState(precios.bonoDescuentoEfectivoPct.toString());
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; error: boolean } | null>(null);

  const cambiado =
    torneoEfectivo !== precios.torneoEfectivo.toString() ||
    torneoTransferencia !== precios.torneoTransferencia.toString() ||
    bonoTransferencia !== precios.bonoTransferencia.toString() ||
    descuento !== precios.bonoDescuentoEfectivoPct.toString();

  const pct = Math.min(100, Math.max(0, parseInt(descuento) || 0));
  const bonoEfectivo = precioEfectivoDesde(parseInt(bonoTransferencia) || 0, pct);

  const guardar = async () => {
    setGuardando(true);
    setMensaje(null);
    try {
      const res = await fetch("/api/configuracion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          precios: {
            torneoEfectivo: parseInt(torneoEfectivo) || 0,
            torneoTransferencia: parseInt(torneoTransferencia) || 0,
            bonoTransferencia: parseInt(bonoTransferencia) || 0,
            bonoDescuentoEfectivoPct: pct,
          },
        }),
      });
      if (!res.ok) throw new Error();
      onGuardado();
      setMensaje({ texto: "Valores guardados", error: false });
    } catch {
      setMensaje({ texto: "No se pudo guardar. Probá de nuevo.", error: true });
    }
    setGuardando(false);
  };

  return (
    <div className="space-y-4">
      {seccion === "TORNEO" && (
      <div>
        <EtiquetaSeccion>Precio de la inscripción</EtiquetaSeccion>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Efectivo ($)</label>
            <input className={campo} type="number" inputMode="numeric" min="0" value={torneoEfectivo} onChange={(e) => setTorneoEfectivo(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Transferencia ($)</label>
            <input className={campo} type="number" inputMode="numeric" min="0" value={torneoTransferencia} onChange={(e) => setTorneoTransferencia(e.target.value)} />
          </div>
        </div>
      </div>
      )}

      {seccion === "PREMIOS" && (
      <div>
        <EtiquetaSeccion>Bono</EtiquetaSeccion>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Transferencia ($)</label>
            <input className={campo} type="number" inputMode="numeric" min="0" value={bonoTransferencia} onChange={(e) => setBonoTransferencia(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Descuento en efectivo (%)</label>
            <input className={campo} type="number" inputMode="numeric" min="0" max="100" value={descuento} onChange={(e) => setDescuento(e.target.value)} />
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Efectivo: <span className="font-semibold text-foreground">{formatearMoneda(bonoEfectivo)}</span>{" "}
          (se redondea hacia abajo al millar, a favor del cliente)
        </p>
      </div>
      )}

      <p className="text-xs text-muted-foreground">
        Estos precios se cargan al crear {seccion === "TORNEO" ? "un torneo nuevo" : "una entrega nueva"}. Los ya creados no cambian.
      </p>
      {mensaje && <p className={mensaje.error ? "text-sm text-destructive" : "text-sm text-green-600"}>{mensaje.texto}</p>}
      <button
        type="button"
        onClick={guardar}
        disabled={!cambiado || guardando}
        className="h-12 w-full rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground disabled:opacity-50 md:h-8 md:rounded-lg"
      >
        {guardando ? "Guardando..." : "Guardar valores"}
      </button>
    </div>
  );
}
