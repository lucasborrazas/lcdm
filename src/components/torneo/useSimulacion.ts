"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { SIMULACION_VACIA, type Simulacion } from "@/lib/simulacionTorneo";

export type EstadoGuardado = "cargando" | "guardado" | "guardando" | "error";

const ESPERA_GUARDADO_MS = 500;

async function guardar(torneoId: string, sim: Simulacion, keepalive = false) {
  const res = await fetch(`/api/torneo/simulacion?torneoId=${torneoId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sim),
    keepalive,
  });
  if (!res.ok) throw new Error();
}

// Simulacion guardada del torneo: se carga al elegirlo y se autoguarda medio
// segundo despues del ultimo cambio (o al salir, si quedo algo pendiente).
export function useSimulacion(torneoId: string | undefined) {
  // Se guarda junto al torneo al que pertenece: al cambiar de torneo no se
  // muestra la simulacion del anterior mientras carga la nueva.
  const [datos, setDatos] = useState<{ torneoId: string; sim: Simulacion } | null>(null);
  const [estadoGuardado, setEstado] = useState<EstadoGuardado>("guardado");
  const pendiente = useRef<{ torneoId: string; sim: Simulacion } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enviarPendiente = useCallback(async (keepalive = false) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const p = pendiente.current;
    if (!p) return;
    pendiente.current = null;
    try {
      await guardar(p.torneoId, p.sim, keepalive);
      if (!pendiente.current) setEstado("guardado");
    } catch {
      setEstado("error");
    }
  }, []);

  useEffect(() => {
    if (!torneoId) return;
    let vigente = true;
    fetch(`/api/torneo/simulacion?torneoId=${torneoId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((guardada: Simulacion) => {
        if (!vigente) return;
        setDatos({ torneoId, sim: guardada });
        setEstado("guardado");
      })
      .catch(() => vigente && setEstado("error"));
    return () => {
      vigente = false;
      // Cambiar de torneo o salir de la pantalla no pierde lo ultimo editado.
      enviarPendiente(true);
    };
  }, [torneoId, enviarPendiente]);

  const actualizar = useCallback(
    (cambio: (s: Simulacion) => Simulacion) => {
      if (!torneoId) return;
      setDatos((prev) => {
        const nueva = cambio(prev?.torneoId === torneoId ? prev.sim : SIMULACION_VACIA);
        pendiente.current = { torneoId, sim: nueva };
        return { torneoId, sim: nueva };
      });
      setEstado("guardando");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => enviarPendiente(), ESPERA_GUARDADO_MS);
    },
    [torneoId, enviarPendiente]
  );

  const reiniciar = useCallback(() => actualizar(() => SIMULACION_VACIA), [actualizar]);

  const cargada = !!torneoId && datos?.torneoId === torneoId;
  const sim = cargada ? datos.sim : SIMULACION_VACIA;
  const estado: EstadoGuardado = cargada ? estadoGuardado : "cargando";
  return { sim, estado, cargada, actualizar, reiniciar };
}

// Modo del Resumen (real o simulacion), recordado en este navegador.
const CLAVE_MODO = "torneo-resumen-simulacion";
const oyentes = new Set<() => void>();
let modoEnMemoria = false;

function leerModo(): boolean {
  try {
    return localStorage.getItem(CLAVE_MODO) === "1";
  } catch {
    return modoEnMemoria;
  }
}

export function useModoSimulacion(): [boolean, (activo: boolean) => void] {
  const activo = useSyncExternalStore(
    (avisar) => {
      oyentes.add(avisar);
      return () => {
        oyentes.delete(avisar);
      };
    },
    leerModo,
    () => false
  );
  const cambiar = useCallback((nuevo: boolean) => {
    modoEnMemoria = nuevo;
    try {
      localStorage.setItem(CLAVE_MODO, nuevo ? "1" : "0");
    } catch {}
    oyentes.forEach((f) => f());
  }, []);
  return [activo, cambiar];
}

export const nuevoIdSimulado = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `s${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
