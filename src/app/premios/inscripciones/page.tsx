import { InscripcionesPremios } from "@/components/premios/InscripcionesPremios";

export default function InscripcionesPremiosPage({
  searchParams,
}: {
  searchParams: { entregaId?: string; gestionar?: string };
}) {
  return (
    <InscripcionesPremios
      entregaIdInicial={searchParams.entregaId}
      abrirGestionarInicial={searchParams.gestionar === "1"}
    />
  );
}
