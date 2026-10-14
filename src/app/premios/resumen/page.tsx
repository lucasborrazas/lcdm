import { ResumenPremios } from "@/components/premios/ResumenPremios";

export default function ResumenPremiosPage({ searchParams }: { searchParams: { entregaId?: string } }) {
  return <ResumenPremios entregaIdInicial={searchParams.entregaId} />;
}
