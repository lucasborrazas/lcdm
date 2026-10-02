import { PageHeader } from "@/components/shared/PageHeader";
import { InscripcionesTable } from "@/components/torneo/InscripcionesTable";

export default function InscripcionesTorneoPage({
  searchParams,
}: {
  searchParams: { torneoId?: string };
}) {
  return (
    <>
      <PageHeader
        title="Inscripciones — Torneo"
        description="Anotá alumnos indicando edad, horario y monto pagado"
      />
      <InscripcionesTable torneoIdInicial={searchParams.torneoId} />
    </>
  );
}
