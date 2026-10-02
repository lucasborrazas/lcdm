import { PageHeader } from "@/components/shared/PageHeader";
import { GastosDashboard } from "@/components/torneo/GastosDashboard";

export default function ResumenTorneoPage({
  searchParams,
}: {
  searchParams: { torneoId?: string };
}) {
  return (
    <>
      <PageHeader
        title="Resumen — Torneo"
        description="Cuánto entró, cuánto se gastó y cuánto ganaste o perdiste en el mes"
      />
      <GastosDashboard torneoIdInicial={searchParams.torneoId} />
    </>
  );
}
