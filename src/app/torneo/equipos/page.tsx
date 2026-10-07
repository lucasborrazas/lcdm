import { PageHeader } from "@/components/shared/PageHeader";
import { EquiposBoard } from "@/components/torneo/EquiposBoard";

export default function EquiposTorneoPage({
  searchParams,
}: {
  searchParams: { torneoId?: string };
}) {
  return (
    <>
      <div className="hidden md:block">
        <PageHeader
          title="Equipos — Torneo"
          description="Arrastrá a cada alumno al equipo que corresponda, por horario"
        />
      </div>
      <EquiposBoard torneoIdInicial={searchParams.torneoId} />
    </>
  );
}
