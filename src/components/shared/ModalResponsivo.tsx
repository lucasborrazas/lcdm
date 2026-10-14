"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { ProtegerCierre, useCierreProtegido } from "@/components/shared/CierreProtegido";
import { cn } from "@/lib/utils";
import { useEsDesktop } from "./useEsDesktop";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  className?: string;
};

function ModalEscritorio({ open, onOpenChange, title, children, className }: Props) {
  const proteccion = useCierreProtegido({ open, onOpenChange });
  return (
    <Dialog open={open} onOpenChange={proteccion.onOpenChange}>
      <DialogContent className={cn("max-h-[90vh] overflow-y-auto sm:max-w-lg", className)}>
        <ProtegerCierre proteccion={proteccion}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {children}
        </ProtegerCierre>
      </DialogContent>
    </Dialog>
  );
}

// Dialogo en escritorio y hoja inferior en mobile, con el mismo contenido.
// El contenido avisa sus cambios sin guardar con useReportarCambios.
export function ModalResponsivo(props: Props) {
  const esDesktop = useEsDesktop();
  if (!esDesktop) {
    return (
      <BottomSheet open={props.open} onOpenChange={props.onOpenChange} title={props.title}>
        {props.children}
      </BottomSheet>
    );
  }
  return <ModalEscritorio {...props} />;
}
