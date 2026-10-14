"use client";

import { useCallback, useEffect, useState } from "react";

// GET de un JSON con recarga manual. url null = no carga todavia. Mientras llega
// la respuesta de una url nueva devuelve `inicial` (no los datos de la anterior).
export function useFetchJson<T>(url: string | null, inicial: T) {
  const [estado, setEstado] = useState<{ url: string | null; data: T }>({ url: null, data: inicial });

  useEffect(() => {
    if (!url) return;
    let vigente = true;
    fetch(url)
      .then((res) => res.json())
      .then((data: T) => {
        if (vigente) setEstado({ url, data });
      });
    return () => {
      vigente = false;
    };
  }, [url]);

  const recargar = useCallback(async () => {
    if (!url) return;
    const res = await fetch(url);
    setEstado({ url, data: (await res.json()) as T });
  }, [url]);

  const cargado = estado.url === url;
  return { data: cargado ? estado.data : inicial, loading: url !== null && !cargado, recargar };
}
