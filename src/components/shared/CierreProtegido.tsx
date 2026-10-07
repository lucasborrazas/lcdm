"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { debeConfirmarCierre, hayCambios } from "@/lib/cierreProtegido";

type Fuentes = Map<string, boolean>;

const ID_SEGUIR = "cierre-seguir-editando";

export type CierreProtegido = {
  /** Reemplaza al onOpenChange del modal: pregunta si hay cambios sin guardar. */
  onOpenChange: (open: boolean) => void;
  /** Cierra sin preguntar (para cuando se guardo bien). */
  cerrar: () => void;
  confirmando: boolean;
  seguirEditando: () => void;
  descartar: () => void;
  fuentes: Fuentes;
};

const Ctx = createContext<Fuentes | null>(null);

// Un modal con cambios sin guardar no se cierra por accidente: la cruz, Esc,
// tocar fuera y Cancelar terminan todos en onOpenChange(false), que se
// intercepta aca. `dirty` son los cambios del propio modal; las partes de
// adentro pueden sumar los suyos con useReportarCambios.
export function useCierreProtegido({
  open,
  onOpenChange,
  dirty = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dirty?: boolean;
}): CierreProtegido {
  const [confirmando, setConfirmando] = useState(false);
  const [fuentes] = useState<Fuentes>(() => new Map());
  const dirtyRef = useRef(dirty);
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  const conCambios = useCallback(() => hayCambios(dirtyRef.current, fuentes.values()), [fuentes]);

  const manejarOpenChange = useCallback(
    (nuevoOpen: boolean) => {
      if (debeConfirmarCierre(nuevoOpen, conCambios())) {
        setConfirmando(true);
        return;
      }
      onOpenChange(nuevoOpen);
    },
    [conCambios, onOpenChange]
  );

  const cerrar = useCallback(() => {
    setConfirmando(false);
    onOpenChange(false);
  }, [onOpenChange]);

  // Recargar o cerrar la pestaña con un modal con cambios: aviso del navegador.
  useEffect(() => {
    if (!open) return;
    const alSalir = (e: BeforeUnloadEvent) => {
      if (!conCambios()) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", alSalir);
    return () => window.removeEventListener("beforeunload", alSalir);
  }, [open, conCambios]);

  return {
    onOpenChange: manejarOpenChange,
    cerrar,
    confirmando,
    seguirEditando: () => setConfirmando(false),
    descartar: cerrar,
    fuentes,
  };
}

// Para modales con varias partes (cada una con su propio "Guardar"): la parte
// avisa si tiene algo sin guardar.
export function useReportarCambios(dirty: boolean) {
  const fuentes = useContext(Ctx);
  const id = useId();
  useEffect(() => {
    if (!fuentes) return;
    fuentes.set(id, dirty);
    return () => {
      fuentes.delete(id);
    };
  }, [fuentes, id, dirty]);
}

// Va DENTRO del contenido del modal (asi la libreria lo trata como modal
// anidado y no pelea por el foco). Muestra el aviso y expone el registro de
// cambios a las partes de adentro.
export function ProtegerCierre({
  proteccion,
  children,
}: {
  proteccion: CierreProtegido;
  children?: React.ReactNode;
}) {
  return (
    <Ctx.Provider value={proteccion.fuentes}>
      {children}
      <Dialog
        open={proteccion.confirmando}
        // Esc o tocar fuera del aviso = seguir editando
        onOpenChange={(abierto) => {
          if (!abierto) proteccion.seguirEditando();
        }}
      >
        <DialogContent
          className="sm:max-w-sm z-[70]"
          showCloseButton={false}
          // el foco arranca en "Seguir editando": un Enter de mas no descarta nada
          initialFocus={() => document.getElementById(ID_SEGUIR)}
        >
          <DialogHeader>
            <DialogTitle>¿Cerrar sin guardar?</DialogTitle>
            <DialogDescription>
              Vas a perder los cambios que hiciste. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="destructive" onClick={proteccion.descartar}>
              Descartar cambios
            </Button>
            <Button type="button" id={ID_SEGUIR} onClick={proteccion.seguirEditando}>
              Seguir editando
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  );
}
