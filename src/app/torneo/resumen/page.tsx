import { PageHeader } from "@/components/shared/PageHeader";
import { GastosDashboard } from "@/components/torneo/GastosDashboard";

export default function ResumenTorneoPage({
  searchParams,
}: {
  searchParams: { torneoId?: string };
}) {
  return (
    <>
      <div className="hidden md:block">
        <PageHeader
          title="Resumen — Torneo"
          description="Cuánto entró, cuánto se gastó y cuánto ganaste o perdiste en el mes"
        />
      </div>
      <GastosDashboard torneoIdInicial={searchParams.torneoId} />
    </>
  );
}
