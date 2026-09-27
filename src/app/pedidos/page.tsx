"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { PedidoForm } from "@/components/pedidos/PedidoForm";
import { PedidosTable } from "@/components/pedidos/PedidosTable";
import type { PedidoConProducto } from "@/lib/types";

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoConProducto[]>([]);

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
      />
      <div className="space-y-6">
        <PedidoForm onSuccess={cargar} />
        <PedidosTable pedidos={pedidos} onUpdate={cargar} />
      </div>
    </>
  );
}
