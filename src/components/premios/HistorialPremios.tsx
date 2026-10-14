"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardList, Plus, Receipt, Wallet } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { MonedaCell } from "@/components/shared/MonedaCell";
import { formatearMoneda } from "@/lib/calculations";
import { useFetchJson } from "@/components/shared/useFetchJson";
import type { EntregaConResumen } from "@/lib/types";
import { EncabezadoPremios } from "./EncabezadoPremios";
import { NuevaEntregaModal } from "./NuevaEntregaModal";

const SIN_ENTREGAS: EntregaConResumen[] = [];

const ENLACES = (id: string) => [
  { href: `/premios/inscripciones?entregaId=${id}`, label: "Inscripciones", icon: ClipboardList },
  { href: `/premios/gastos?entregaId=${id}`, label: "Gastos", icon: Receipt },
  { href: `/premios/resumen?entregaId=${id}`, label: "Resumen", icon: Wallet },
];

export function HistorialPremios() {
  const { data: entregas, loading, recargar } = useFetchJson("/api/premios/entregas", SIN_ENTREGAS);
  const [nuevaAbierta, setNuevaAbierta] = useState(false);

  const nueva = (
    <Button onClick={() => setNuevaAbierta(true)}>
      <Plus className="mr-1.5 h-4 w-4" />
      Nueva entrega
    </Button>
  );

  return (
    <>
      <EncabezadoPremios
        titulo="Historial"
        descripcion="Todas las entregas anuales y cómo les fue"
        entregas={[]}
        entregaId={undefined}
        onSelect={() => {}}
        acciones={nueva}
      />

      <div className="hidden md:block">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Año</TableHead>
                <TableHead>Familias</TableHead>
                <TableHead>Alumnos (M / F)</TableHead>
                <TableHead>Personas</TableHead>
                <TableHead>Cobrado</TableHead>
                <TableHead>Gastos</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead className="w-72"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Cargando...</TableCell></TableRow>
              ) : entregas.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Todavía no hay entregas cargadas</TableCell></TableRow>
              ) : (
                entregas.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.anio}</TableCell>
                    <TableCell>{e.cantidadFamilias}</TableCell>
                    <TableCell>{e.cantidadChicos} ({e.masculino} / {e.femenino})</TableCell>
                    <TableCell>{e.personas}</TableCell>
                    <TableCell><MonedaCell valor={e.cobrado} /></TableCell>
                    <TableCell><MonedaCell valor={e.totalGastos} /></TableCell>
                    <TableCell className={e.ganancia >= 0 ? "font-medium text-[hsl(152_55%_28%)]" : "font-medium text-destructive"}>
                      {e.ganancia >= 0 ? "+" : "-"}
                      <MonedaCell valor={Math.abs(e.ganancia)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {ENLACES(e.id).map(({ href, label, icon: Icon }) => (
                          <Link key={href} href={href} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                            <Icon className="mr-1 h-3.5 w-3.5" />
                            {label}
                          </Link>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="space-y-2.5 md:hidden">
        {loading && <p className="py-10 text-center text-sm text-muted-foreground">Cargando...</p>}
        {!loading && entregas.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">Todavía no hay entregas cargadas</p>
        )}
        {entregas.map((e) => (
          <div key={e.id} className="rounded-[14px] border p-3.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[17px] font-bold">{e.anio}</span>
              <span className={cn("text-[15px] font-bold", e.ganancia >= 0 ? "text-[hsl(152_55%_28%)]" : "text-destructive")}>
                {e.ganancia >= 0 ? "+" : "-"}
                {formatearMoneda(Math.abs(e.ganancia))}
              </span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {e.cantidadFamilias} familias · {e.cantidadChicos} alumnos ({e.masculino} masc. / {e.femenino} fem.) · {e.personas} personas
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Cobrado {formatearMoneda(e.cobrado)} · Gastos {formatearMoneda(e.totalGastos)}
            </div>
            <div className="mt-2.5 flex gap-2">
              {ENLACES(e.id).map(({ href, label }) => (
                <Link key={href} href={href} className="flex h-10 flex-1 items-center justify-center rounded-xl bg-muted text-[13px] font-semibold">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setNuevaAbierta(true)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border text-[15px] font-semibold"
        >
          <Plus className="h-4 w-4" />
          Nueva entrega
        </button>
      </div>

      <NuevaEntregaModal open={nuevaAbierta} onOpenChange={setNuevaAbierta} entregas={entregas} onCreada={() => recargar()} />
    </>
  );
}
