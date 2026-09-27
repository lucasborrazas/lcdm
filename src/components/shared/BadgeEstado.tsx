import { Badge } from "@/components/ui/badge";

const ESTADO_PEDIDO_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  POR_PEDIR: { label: "Por pedir", variant: "outline" },
  ENCARGADO: { label: "Encargado", variant: "secondary" },
  ENTREGADO: { label: "Entregado", variant: "default" },
};

const ESTADO_PAGO_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  PENDIENTE: { label: "Pendiente", variant: "outline" },
  SENA: { label: "Seña", variant: "secondary" },
  PAGO: { label: "Pagado", variant: "default" },
};

export function BadgeEstadoPedido({ estado }: { estado: string }) {
  const config = ESTADO_PEDIDO_CONFIG[estado] ?? { label: estado, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function BadgeEstadoPago({ estado }: { estado: string }) {
  const config = ESTADO_PAGO_CONFIG[estado] ?? { label: estado, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
