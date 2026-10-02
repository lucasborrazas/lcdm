"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, ClipboardList, Users, Wallet } from "lucide-react";
import { MonedaCell } from "@/components/shared/MonedaCell";
import { NuevoTorneoDialog } from "./NuevoTorneoDialog";
import { nombreTorneo, ESTADOS_TORNEO } from "@/lib/torneo";
import type { TorneoConResumen } from "@/lib/types";

export function HistorialTorneos() {
  const [torneos, setTorneos] = useState<TorneoConResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [nuevoOpen, setNuevoOpen] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/torneo/torneos");
    setTorneos(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const actualizarEstado = async (id: string, estado: string) => {
    setTorneos((prev) => prev.map((t) => (t.id === id ? { ...t, estado: estado as TorneoConResumen["estado"] } : t)));
    await fetch(`/api/torneo/torneos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setNuevoOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nuevo torneo
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mes</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Inscriptos</TableHead>
              <TableHead>Recaudado</TableHead>
              <TableHead>Gastos</TableHead>
              <TableHead>Resultado</TableHead>
              <TableHead className="w-56"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Cargando...</TableCell></TableRow>
            ) : torneos.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Todavía no hay torneos cargados</TableCell></TableRow>
            ) : (
              torneos.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{nombreTorneo(t.mes, t.anio)}</TableCell>
                  <TableCell>
                    <Select value={t.estado} onValueChange={(v) => actualizarEstado(t.id, v)}>
                      <SelectTrigger className="h-8 w-36 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADOS_TORNEO.map((e) => (
                          <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{t.cantidadInscriptos}</TableCell>
                  <TableCell><MonedaCell valor={t.recaudado} /></TableCell>
                  <TableCell><MonedaCell valor={t.totalGastos} /></TableCell>
                  <TableCell className={t.ganancia >= 0 ? "text-green-600 font-medium" : "text-destructive font-medium"}>
                    {t.ganancia >= 0 ? "+" : "-"}
                    <MonedaCell valor={Math.abs(t.ganancia)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Link href={`/torneo/inscripciones?torneoId=${t.id}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                        <ClipboardList className="h-3.5 w-3.5 mr-1" />
                        Inscripciones
                      </Link>
                      <Link href={`/torneo/equipos?torneoId=${t.id}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                        <Users className="h-3.5 w-3.5 mr-1" />
                        Equipos
                      </Link>
                      <Link href={`/torneo/resumen?torneoId=${t.id}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                        <Wallet className="h-3.5 w-3.5 mr-1" />
                        Resumen
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <NuevoTorneoDialog
        open={nuevoOpen}
        onOpenChange={setNuevoOpen}
        torneos={torneos}
        onCreated={cargar}
      />
    </div>
  );
}
