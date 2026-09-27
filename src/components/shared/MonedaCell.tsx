import { formatearMoneda } from "@/lib/calculations";

export function MonedaCell({ valor }: { valor: number | null | undefined }) {
  if (valor == null) return <span className="text-muted-foreground">—</span>;
  return <span>{formatearMoneda(valor)}</span>;
}
