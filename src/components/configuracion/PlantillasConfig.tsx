"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useFetchJson } from "@/components/shared/useFetchJson";

type Plantilla = { id: string; hora: string; grupoEdad: { nombre: string } | null };
type Seccion = "TORNEO" | "PREMIOS";

const campo = "h-12 w-full rounded-xl bg-muted px-3 text-[15px] outline-none md:h-8 md:rounded-lg md:border md:border-input md:bg-transparent md:px-2.5 md:py-1 md:text-sm md:focus-visible:border-ring md:focus-visible:ring-3 md:focus-visible:ring-ring/50";
const SIN_PLANTILLAS: Plantilla[] = [];

async function leerError(res: Response, porDefecto: string): Promise<string> {
  const data = await res.json().catch(() => null);
  const error = data?.error;
  if (typeof error === "string") return error;
  const campoGrupo = error?.fieldErrors?.grupoEdadNombre?.[0];
  return typeof campoGrupo === "string" ? campoGrupo : porDefecto;
}

function FilaPlantilla({
  plantilla,
  seccion,
  onCambio,
}: {
  plantilla: Plantilla;
  seccion: Seccion;
  onCambio: () => void;
}) {
  const [hora, setHora] = useState(plantilla.hora);
  const [grupo, setGrupo] = useState(plantilla.grupoEdad?.nombre ?? "");
  const [error, setError] = useState<string | null>(null);

  const cambiado = hora !== plantilla.hora || grupo.trim() !== (plantilla.grupoEdad?.nombre ?? "");

  const guardar = async () => {
    setError(null);
    const res = await fetch(`/api/configuracion/plantillas/${plantilla.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hora, grupoEdadNombre: grupo.trim() || null }),
    });
    if (!res.ok) return setError(await leerError(res, "No se pudo guardar"));
    onCambio();
  };

  const eliminar = async () => {
    await fetch(`/api/configuracion/plantillas/${plantilla.id}`, { method: "DELETE" });
    onCambio();
  };

  return (
    <div className="border-b px-3 py-2.5 last:border-b-0">
      <div className="flex items-center gap-2">
        <input className={`${campo} !w-28 shrink-0`} type="time" value={hora} onChange={(e) => setHora(e.target.value)} aria-label="Hora" />
        <input
          className={campo}
          placeholder={seccion === "TORNEO" ? "Grupo de edad" : "Grupo etario (opcional)"}
          value={grupo}
          onChange={(e) => setGrupo(e.target.value)}
          aria-label="Grupo de edad"
        />
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={eliminar}
          aria-label="Quitar horario"
          className="flex h-10 w-10 items-center justify-center rounded-xl border text-destructive md:h-8 md:rounded-lg"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={guardar}
          disabled={!cambiado || !hora}
          className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-40 md:h-8 md:rounded-lg"
        >
          Guardar
        </button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function PlantillasConfig({ seccion, descripcion }: { seccion: Seccion; descripcion: string }) {
  const { data: plantillas, recargar } = useFetchJson<Plantilla[]>(
    `/api/configuracion/plantillas?seccion=${seccion}`,
    SIN_PLANTILLAS
  );
  const [hora, setHora] = useState("");
  const [grupo, setGrupo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const agregar = async () => {
    setError(null);
    const res = await fetch("/api/configuracion/plantillas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seccion, hora, grupoEdadNombre: grupo.trim() || null }),
    });
    if (!res.ok) return setError(await leerError(res, "No se pudo agregar"));
    setHora("");
    setGrupo("");
    recargar();
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{descripcion}</p>
      {plantillas.length > 0 ? (
        <div className="overflow-hidden rounded-[14px] border">
          {plantillas.map((p) => (
            <FilaPlantilla key={`${p.id}-${p.hora}-${p.grupoEdad?.nombre ?? ""}`} plantilla={p} seccion={seccion} onCambio={recargar} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
          Sin horarios en la plantilla.
        </p>
      )}
      <div className="flex items-center gap-2">
        <input className={`${campo} !w-28 shrink-0`} type="time" value={hora} onChange={(e) => setHora(e.target.value)} aria-label="Hora nueva" />
        <input
          className={campo}
          placeholder={seccion === "TORNEO" ? "Grupo de edad" : "Grupo etario (opcional)"}
          value={grupo}
          onChange={(e) => setGrupo(e.target.value)}
        />
        <button
          type="button"
          onClick={agregar}
          disabled={!hora}
          className="flex h-12 shrink-0 items-center gap-1.5 rounded-xl border px-4 text-sm font-semibold disabled:opacity-40 md:h-8 md:rounded-lg"
        >
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
