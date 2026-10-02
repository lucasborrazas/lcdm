"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { TorneoConResumen } from "@/lib/types";

export function useTorneoActual(torneoIdInicial?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const [torneos, setTorneos] = useState<TorneoConResumen[]>([]);
  const [torneoId, setTorneoIdState] = useState<string | undefined>(torneoIdInicial);
  const [loading, setLoading] = useState(true);

  const cargarTorneos = useCallback(async () => {
    const res = await fetch("/api/torneo/torneos");
    const data: TorneoConResumen[] = await res.json();
    setTorneos(data);
    setLoading(false);
    return data;
  }, []);

  useEffect(() => {
    cargarTorneos().then((data) => {
      setTorneoIdState((prev) => prev ?? data[0]?.id);
    });
  }, [cargarTorneos]);

  const seleccionarTorneo = (id: string) => {
    setTorneoIdState(id);
    router.replace(`${pathname}?torneoId=${id}`);
  };

  const torneoActual = torneos.find((t) => t.id === torneoId) ?? null;

  return {
    torneos,
    torneoId,
    torneoActual,
    seleccionarTorneo,
    loading,
    recargarTorneos: cargarTorneos,
  };
}
