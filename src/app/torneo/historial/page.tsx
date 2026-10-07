import { PageHeader } from "@/components/shared/PageHeader";
import { HistorialTorneos } from "@/components/torneo/HistorialTorneos";

export default function HistorialTorneosPage() {
  return (
    <>
      <div className="hidden md:block">
        <PageHeader
          title="Historial de torneos"
          description="Todas las ediciones mensuales, su estado y cómo les fue"
        />
      </div>
      <HistorialTorneos />
    </>
  );
}
