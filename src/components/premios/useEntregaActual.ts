"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useFetchJson } from "@/components/shared/useFetchJson";
import type { EntregaConResumen } from "@/lib/types";

const SIN_ENTREGAS: EntregaConResumen[] = [];

export function useEntregaActual(entregaIdInicial?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: entregas, loading, recargar } = useFetchJson("/api/premios/entregas", SIN_ENTREGAS);
  const [elegida, setElegida] = useState<string | undefined>(entregaIdInicial);

  // Sin eleccion, la mas reciente.
  const entregaId = elegida ?? entregas[0]?.id;
  const entregaActual = entregas.find((e) => e.id === entregaId) ?? null;

  const seleccionarEntrega = (id: string) => {
    setElegida(id);
    router.replace(`${pathname}?entregaId=${id}`);
  };

  return {
    entregas,
    entregaId,
    entregaActual,
    seleccionarEntrega,
    loading,
    recargarEntregas: recargar,
  };
}
