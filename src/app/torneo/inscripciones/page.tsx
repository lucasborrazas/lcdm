import { PageHeader } from "@/components/shared/PageHeader";
import { InscripcionesTable } from "@/components/torneo/InscripcionesTable";

export default function InscripcionesTorneoPage({
  searchParams,
}: {
  searchParams: { torneoId?: string; gestionar?: string };
}) {
  return (
    <>
      <div className="hidden md:block">
        <PageHeader
          title="Inscripciones — Torneo"
          description="Anotá alumnos indicando edad, horario y monto pagado"
        />
      </div>
      <InscripcionesTable
        torneoIdInicial={searchParams.torneoId}
        abrirGestionarInicial={searchParams.gestionar === "1"}
      />
    </>
  );
}
