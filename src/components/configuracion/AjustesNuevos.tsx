"use client";

import { ChevronDown } from "lucide-react";
import { useFetchJson } from "@/components/shared/useFetchJson";
import { PRECIOS_POR_DEFECTO, type PreciosConfig } from "@/lib/preciosConfig";
import { FormPrecios } from "./PreciosConfig";
import { GruposEdadConfig } from "./GruposEdadConfig";
import { PlantillasConfig } from "./PlantillasConfig";

const CONFIG_INICIAL = { precios: PRECIOS_POR_DEFECTO };

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold">{titulo}</h3>
      {children}
    </div>
  );
}

// Valores que se cargan al crear un torneo/entrega nuevo. Vive dentro de
// "Gestionar" de cada seccion, plegado para no tapar lo del periodo actual.
export function AjustesNuevos({ seccion }: { seccion: "TORNEO" | "PREMIOS" }) {
  const { data: config, loading, recargar } = useFetchJson<{ precios: PreciosConfig }>(
    "/api/configuracion",
    CONFIG_INICIAL
  );
  const esTorneo = seccion === "TORNEO";

  return (
    <details className="group rounded-[14px] border">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-4 py-2">
        <div>
          <div className="text-[15px] font-semibold">
            {esTorneo ? "Valores para torneos nuevos" : "Valores para entregas nuevas"}
          </div>
          <div className="text-xs text-muted-foreground">
            {esTorneo ? "Precios, horarios y grupos de edad" : "Bono y turnos de partida"}
          </div>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-5 border-t px-4 py-4">
        <Bloque titulo="Precios">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <FormPrecios
              key={JSON.stringify(config.precios)}
              seccion={seccion}
              precios={config.precios}
              onGuardado={recargar}
            />
          )}
        </Bloque>
        <Bloque titulo={esTorneo ? "Horarios de partida" : "Turnos de partida"}>
          <PlantillasConfig
            seccion={seccion}
            descripcion={
              esTorneo
                ? "Se crean solos al armar un torneo nuevo sin duplicar otro. Cada horario lleva su grupo de edad."
                : "Se crean solos al armar una entrega nueva sin copiar la anterior."
            }
          />
        </Bloque>
        {esTorneo && (
          <Bloque titulo="Grupos de edad">
            <GruposEdadConfig />
          </Bloque>
        )}
      </div>
    </details>
  );
}
