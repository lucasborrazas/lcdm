import { PageHeader } from "@/components/shared/PageHeader";
import { HistorialTorneos } from "@/components/torneo/HistorialTorneos";

export default function HistorialTorneosPage() {
  return (
    <>
      <PageHeader
        title="Historial de torneos"
        description="Todas las ediciones mensuales, su estado y cómo les fue"
      />
      <HistorialTorneos />
    </>
  );
}
