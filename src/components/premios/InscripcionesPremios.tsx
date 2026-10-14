"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFetchJson } from "@/components/shared/useFetchJson";
import type { TurnoConConteo } from "@/lib/types";
import { EncabezadoPremios, SinEntrega } from "./EncabezadoPremios";
import { GestionarEntregaModal } from "./GestionarEntregaModal";
import { useEntregaActual } from "./useEntregaActual";

const SIN_TURNOS: TurnoConConteo[] = [];

export function InscripcionesPremios({
  entregaIdInicial,
  abrirGestionarInicial,
}: {
  entregaIdInicial?: string;
  abrirGestionarInicial?: boolean;
}) {
  const { entregas, entregaId, entregaActual, seleccionarEntrega, loading, recargarEntregas } =
    useEntregaActual(entregaIdInicial);
  const { data: turnos, recargar: recargarTurnos } = useFetchJson<TurnoConConteo[]>(
    entregaId ? `/api/premios/turnos?entregaId=${entregaId}` : null,
    SIN_TURNOS
  );
  // "Gestionar entrega" desde Mas (mobile): /premios/inscripciones?gestionar=1;
  // el modal espera a que la entrega este cargada.
  const [gestionarOpen, setGestionarOpen] = useState(!!abrirGestionarInicial);

  const onEntregaActualizada = async () => {
    await recargarEntregas();
    await recargarTurnos();
  };

  const onEntregaCreada = async (id: string) => {
    await recargarEntregas();
    seleccionarEntrega(id);
  };

  return (
    <>
      <EncabezadoPremios
        titulo="Inscripciones"
        descripcion="Anotá a las familias por turno: chicos, personas y bono"
        entregas={entregas}
        entregaId={entregaId}
        onSelect={seleccionarEntrega}
        acciones={
          <Button variant="outline" onClick={() => setGestionarOpen(true)} disabled={!entregaId}>
            <Settings2 className="mr-1.5 h-4 w-4" />
            Gestionar entrega
          </Button>
        }
      />

      {!loading && entregas.length === 0 ? (
        <SinEntrega entregas={entregas} onCreada={onEntregaCreada} />
      ) : (
        <div className="space-y-2">
          {turnos.map((t) => (
            <div key={t.id} className="rounded-[14px] border px-4 py-3">
              <span className="font-semibold">{t.hora}</span>
              {t.grupoEdad && <span className="text-muted-foreground"> · {t.grupoEdad.nombre}</span>}
              {!t.activo && <span className="text-muted-foreground"> · inactivo</span>}
            </div>
          ))}
        </div>
      )}

      <GestionarEntregaModal
        open={gestionarOpen}
        onOpenChange={setGestionarOpen}
        entrega={entregaActual}
        turnos={turnos}
        onUpdate={onEntregaActualizada}
      />
    </>
  );
}
