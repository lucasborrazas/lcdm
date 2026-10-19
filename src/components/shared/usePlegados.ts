"use client";

import { useCallback, useSyncExternalStore } from "react";

// Ids de bloques plegados (horarios, turnos...), recordados en este navegador.
// En el servidor y en el primer render todo arranca desplegado.
const oyentes = new Set<() => void>();
const enMemoria = new Map<string, string>();
const VACIO: string[] = [];
const cache = new Map<string, { crudo: string; valor: string[] }>();

function leerCrudo(clave: string): string {
  try {
    return localStorage.getItem(clave) ?? "[]";
  } catch {
    return enMemoria.get(clave) ?? "[]";
  }
}

// useSyncExternalStore necesita la misma referencia mientras no cambie el dato.
function leer(clave: string): string[] {
  const crudo = leerCrudo(clave);
  const previo = cache.get(clave);
  if (previo?.crudo === crudo) return previo.valor;
  let valor: string[];
  try {
    const parsed = JSON.parse(crudo);
    valor = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    valor = [];
  }
  cache.set(clave, { crudo, valor });
  return valor;
}

export function usePlegados(clave: string) {
  const plegados = useSyncExternalStore(
    (avisar) => {
      oyentes.add(avisar);
      return () => {
        oyentes.delete(avisar);
      };
    },
    () => leer(clave),
    () => VACIO
  );

  const guardar = useCallback(
    (nuevo: string[]) => {
      const crudo = JSON.stringify(nuevo);
      enMemoria.set(clave, crudo);
      try {
        localStorage.setItem(clave, crudo);
      } catch {}
      oyentes.forEach((f) => f());
    },
    [clave]
  );

  const alternar = useCallback(
    (id: string) => guardar(plegados.includes(id) ? plegados.filter((x) => x !== id) : [...plegados, id]),
    [guardar, plegados]
  );

  return { plegados, alternar, plegarTodos: guardar, desplegarTodos: () => guardar([]) };
}
