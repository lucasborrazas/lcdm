"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useFetchJson } from "@/components/shared/useFetchJson";
import { EtiquetaSeccion } from "@/components/mobile/ui";
import { formatearMoneda } from "@/lib/calculations";
import { resumenPorTurno, totalesEntrega } from "@/lib/premios";
import type { FamiliaConChicos, GastoEntrega, TurnoConConteo } from "@/lib/types";
import { COLOR_FEMENINO, COLOR_MASCULINO, GraficoChicos } from "./GraficoChicos";
import { EncabezadoPremios, SinEntrega } from "./EncabezadoPremios";
import { useEntregaActual } from "./useEntregaActual";

const SIN_TURNOS: TurnoConConteo[] = [];
const SIN_FAMILIAS: FamiliaConChicos[] = [];
const SIN_GASTOS: GastoEntrega[] = [];

function Dato({ titulo, valor, detalle, className }: { titulo: string; valor: string; detalle?: string; className?: string }) {
  return (
    <div className={cn("rounded-[14px] bg-muted px-3.5 py-3", className)}>
      <div className="text-xs font-medium text-muted-foreground">{titulo}</div>
      <div className="text-[22px] font-bold leading-tight">{valor}</div>
      {detalle && <div className="mt-0.5 text-xs text-muted-foreground">{detalle}</div>}
    </div>
  );
}

function Punto({ color, texto }: { color: string; texto: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium">
      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
      {texto}
    </span>
  );
}

export function ResumenPremios({ entregaIdInicial }: { entregaIdInicial?: string }) {
  const { entregas, entregaId, seleccionarEntrega, loading, recargarEntregas } = useEntregaActual(entregaIdInicial);
  const { data: turnos } = useFetchJson<TurnoConConteo[]>(
    entregaId ? `/api/premios/turnos?entregaId=${entregaId}` : null,
    SIN_TURNOS
  );
  const { data: familias } = useFetchJson<FamiliaConChicos[]>(
    entregaId ? `/api/premios/familias?entregaId=${entregaId}` : null,
    SIN_FAMILIAS
  );
  const { data: gastos } = useFetchJson<GastoEntrega[]>(
    entregaId ? `/api/premios/gastos?entregaId=${entregaId}` : null,
    SIN_GASTOS
  );

  const t = useMemo(() => totalesEntrega(familias, gastos), [familias, gastos]);
  const turnosVisibles = useMemo(
    () => turnos.filter((x) => x.activo || familias.some((f) => f.turnoId === x.id)),
    [turnos, familias]
  );
  const porTurno = useMemo(
    () => resumenPorTurno(turnosVisibles.map((x) => x.id), familias),
    [turnosVisibles, familias]
  );
  const datosGrafico = turnosVisibles.map((x, i) => ({
    hora: x.hora,
    masculino: porTurno[i].masculino,
    femenino: porTurno[i].femenino,
  }));

  const onEntregaCreada = async (id: string) => {
    await recargarEntregas();
    seleccionarEntrega(id);
  };

  return (
    <>
      <EncabezadoPremios
        titulo="Resumen"
        descripcion="Cuánto entró, cuánto se gastó y cuánta gente viene"
        entregas={entregas}
        entregaId={entregaId}
        onSelect={seleccionarEntrega}
      />

      {!loading && entregas.length === 0 ? (
        <SinEntrega entregas={entregas} onCreada={onEntregaCreada} />
      ) : (
        <div className="max-w-4xl space-y-5">
          <div className="rounded-[18px] bg-primary p-4 text-primary-foreground">
            <div className="text-xs font-semibold uppercase tracking-wide opacity-80">
              {t.ganancia >= 0 ? "Ganancia" : "Pérdida"}
            </div>
            <div className="text-[30px] font-bold leading-tight">{formatearMoneda(Math.abs(t.ganancia))}</div>
            <div className="mt-3 flex gap-2">
              <div className="flex-1 rounded-xl bg-white/15 px-3 py-2">
                <div className="text-[11px] opacity-80">Cobrado</div>
                <div className="text-base font-bold">{formatearMoneda(t.cobrado)}</div>
              </div>
              <div className="flex-1 rounded-xl bg-white/15 px-3 py-2">
                <div className="text-[11px] opacity-80">Gastos</div>
                <div className="text-base font-bold">{formatearMoneda(t.gastos)}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <Dato
              titulo="Falta cobrar"
              valor={formatearMoneda(t.pendiente)}
              detalle={`${t.familias - t.familiasPagaron} de ${t.familias} familias`}
              className="bg-[hsl(30_90%_94%)]"
            />
            <Dato titulo="Cobrado en efectivo" valor={formatearMoneda(t.cobradoEfectivo)} />
            <Dato titulo="Cobrado por transferencia" valor={formatearMoneda(t.cobradoTransferencia)} />
          </div>

          <div>
            <EtiquetaSeccion>Cuánta gente viene</EtiquetaSeccion>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <Dato titulo="Familias" valor={t.familias.toString()} />
              <Dato titulo="Personas en total" valor={t.personas.toString()} detalle="con los alumnos" />
              <Dato titulo="Alumnos (copas)" valor={t.chicos.toString()} />
              <Dato
                titulo="Masc. / Fem."
                valor={`${t.masculino} / ${t.femenino}`}
              />
            </div>
          </div>

          <div>
            <EtiquetaSeccion>Alumnos por turno</EtiquetaSeccion>
            <div className="rounded-[14px] border p-3">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-4">
                  <Punto color={COLOR_MASCULINO} texto={`Masculino ${t.masculino}`} />
                  <Punto color={COLOR_FEMENINO} texto={`Femenino ${t.femenino}`} />
                </div>
                <span className="text-sm font-bold">Total {t.chicos}</span>
              </div>
              {t.chicos === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Todavía no hay alumnos inscriptos</p>
              ) : (
                <GraficoChicos datos={datosGrafico} />
              )}
            </div>
          </div>

          <div>
            <EtiquetaSeccion>Detalle por turno</EtiquetaSeccion>
            <div className="overflow-hidden rounded-[14px] border">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 border-b bg-muted/60 px-4 py-2 text-xs font-semibold text-muted-foreground">
                <span>Turno</span>
                <span className="text-right">Familias</span>
                <span className="text-right">Alumnos</span>
                <span className="text-right">Personas</span>
              </div>
              {turnosVisibles.map((x, i) => (
                <div
                  key={x.id}
                  className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 border-b px-4 py-2.5 text-[15px] last:border-b-0"
                >
                  <span className="min-w-0 truncate font-semibold">
                    {x.hora}
                    {x.grupoEdad && <span className="font-normal text-muted-foreground"> · {x.grupoEdad.nombre}</span>}
                  </span>
                  <span className="text-right">{porTurno[i].familias}</span>
                  <span className="text-right">{porTurno[i].chicos}</span>
                  <span className="text-right font-semibold">{porTurno[i].personas}</span>
                </div>
              ))}
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 bg-muted/60 px-4 py-2.5 text-[15px] font-bold">
                <span>Total</span>
                <span className="text-right">{t.familias}</span>
                <span className="text-right">{t.chicos}</span>
                <span className="text-right">{t.personas}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
