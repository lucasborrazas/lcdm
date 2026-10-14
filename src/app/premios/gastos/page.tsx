import { GastosPremios } from "@/components/premios/GastosPremios";

export default function GastosPremiosPage({ searchParams }: { searchParams: { entregaId?: string } }) {
  return <GastosPremios entregaIdInicial={searchParams.entregaId} />;
}
