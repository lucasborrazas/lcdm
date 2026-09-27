"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { MovimientoForm } from "@/components/movimientos/MovimientoForm";
import { MovimientosTable } from "@/components/movimientos/MovimientosTable";
import type { MovimientoConProducto } from "@/lib/types";

export default function MovimientosPage() {
  const [movimientos, setMovimientos] = useState<MovimientoConProducto[]>([]);

  const cargar = () => {
    fetch("/api/movimientos")
      .then((r) => r.json())
      .then(setMovimientos);
  };

  useEffect(() => { cargar(); }, []);

  return (
    <>
      <PageHeader
        title="Movimientos de stock"
        description="Registrá ingresos y egresos de mercadería"
      />
      <div className="space-y-6">
        <MovimientoForm onSuccess={cargar} />
        <MovimientosTable movimientos={movimientos} />
      </div>
    </>
  );
}
