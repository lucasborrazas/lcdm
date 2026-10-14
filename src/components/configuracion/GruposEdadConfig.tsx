"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useEsDesktop } from "@/components/shared/useEsDesktop";
import { useFetchJson } from "@/components/shared/useFetchJson";

type Grupo = { id: string; nombre: string; enUso: number };

const campo = "h-12 w-full rounded-xl bg-muted px-3 text-[15px] outline-none";
const SIN_GRUPOS: Grupo[] = [];

async function leerError(res: Response, porDefecto: string): Promise<string> {
  const data = await res.json().catch(() => null);
  return typeof data?.error === "string" ? data.error : porDefecto;
}

function FilaGrupo({ grupo, onCambio }: { grupo: Grupo; onCambio: () => void }) {
  const esDesktop = useEsDesktop();
  const [nombre, setNombre] = useState(grupo.nombre);
  const [error, setError] = useState<string | null>(null);

  const guardar = async () => {
    setError(null);
    const res = await fetch(`/api/configuracion/grupos-edad/${grupo.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre }),
    });
    if (!res.ok) return setError(await leerError(res, "No se pudo guardar"));
    onCambio();
  };

  const eliminar = async () => {
    if (esDesktop && !confirm(`¿Eliminar el grupo "${grupo.nombre}"?`)) return;
    setError(null);
    const res = await fetch(`/api/configuracion/grupos-edad/${grupo.id}`, { method: "DELETE" });
    if (!res.ok) return setError(await leerError(res, "No se pudo eliminar"));
    onCambio();
  };

  return (
    <div className="border-b px-3 py-2.5 last:border-b-0">
      <div className="flex items-center gap-2">
        <input className={campo} value={nombre} onChange={(e) => setNombre(e.target.value)} aria-label="Nombre del grupo" />
        <button
          type="button"
          onClick={guardar}
          disabled={!nombre.trim() || nombre.trim() === grupo.nombre}
          className="h-12 shrink-0 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={eliminar}
          aria-label={`Eliminar ${grupo.nombre}`}
          className="flex h-12 w-11 shrink-0 items-center justify-center rounded-xl border text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1 px-1 text-xs text-muted-foreground">
        {grupo.enUso === 0 ? "Sin usar" : `Lo usan ${grupo.enUso} horario(s) o turno(s)`}
      </p>
      {error && <p className="px-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function GruposEdadConfig() {
  const { data: grupos, recargar } = useFetchJson<Grupo[]>("/api/configuracion/grupos-edad", SIN_GRUPOS);
  const [nuevo, setNuevo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const agregar = async () => {
    setError(null);
    const res = await fetch("/api/configuracion/grupos-edad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nuevo }),
    });
    if (!res.ok) return setError(await leerError(res, "No se pudo agregar"));
    setNuevo("");
    recargar();
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Se comparten entre Torneo y Entrega de premios. Al renombrar uno cambia en todos los horarios que lo usan.
      </p>
      {grupos.length > 0 && (
        <div className="overflow-hidden rounded-[14px] border">
          {grupos.map((g) => (
            <FilaGrupo key={`${g.id}-${g.nombre}`} grupo={g} onCambio={recargar} />
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <input className={campo} placeholder="Nuevo grupo (ej: Sala de 3 a 5)" value={nuevo} onChange={(e) => setNuevo(e.target.value)} />
        <button
          type="button"
          onClick={agregar}
          disabled={!nuevo.trim()}
          className="flex h-12 shrink-0 items-center gap-1.5 rounded-xl border px-4 text-sm font-semibold disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
