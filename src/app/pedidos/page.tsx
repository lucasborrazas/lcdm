"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PedidoCreateDialog } from "@/components/pedidos/PedidoCreateDialog";
import { PedidosTable } from "@/components/pedidos/PedidosTable";
import type { PedidoConProducto } from "@/lib/types";

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoConProducto[]>([]);
  const [crearOpen, setCrearOpen] = useState(false);

  const cargar = () => {
    fetch("/api/pedidos")
      .then((r) => r.json())
      .then(setPedidos);
  };

  useEffect(() => { cargar(); }, []);

  return (
    <>
      <PageHeader
        title="Pedidos"
        description="Registrá y gestioná pedidos de clientes"
        action={
          <Button onClick={() => setCrearOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo pedido
          </Button>
        }
      />

      <PedidosTable pedidos={pedidos} onUpdate={cargar} />

      <PedidoCreateDialog
        open={crearOpen}
        onOpenChange={setCrearOpen}
        onSuccess={cargar}
      />
    </>
  );
}
