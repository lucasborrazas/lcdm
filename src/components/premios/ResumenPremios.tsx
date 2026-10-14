"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useFetchJson } from "@/components/shared/useFetchJson";
import { Chip, EtiquetaSeccion } from "@/components/mobile/ui";
import { formatearMoneda } from "@/lib/calculations";
import { resumenPorTurno, totalesEntrega } from "@/lib/premios";
import type { FamiliaConChicos, GastoEntrega, TurnoConConteo } from "@/lib/types";
import { COLOR_FEMENINO, COLOR_MASCULINO, GraficoChicos } from "./GraficoChicos";
import { EncabezadoPremios, SinEntrega } from "./EncabezadoPremios";
import { NuevaEntregaModal } from "./NuevaEntregaModal";
import { useEntregaActual } from "./useEntregaActual";

const SIN_TURNOS: TurnoConConteo[] = [];
const SIN_FAMILIAS: FamiliaConChicos[] = [];
const SIN_GASTOS: GastoEntrega[] = [];

function Dato({ titulo, valor, detalle, className, grande }: { titulo: string; valor: string; detalle?: string; className?: string; grande?: boolean }) {
  return (
    <div className={cn("rounded-[14px] bg-muted px-3.5 py-3", className)}>
      <div className="text-xs font-medium text-muted-foreground">{titulo}</div>
      <div className={cn("font-bold leading-tight", grande ? "text-[34px]" : "text-[22px]")}>{valor}</div>
      {detalle && <div className="mt-0.5 text-xs text-muted-foreground">{detalle}</div>}
    </div>
  );
}

function MetricaCard({ titulo, valor, color, className }: { titulo: string; valor: string; color?: string; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn("text-2xl font-bold", color)}>{valor}</p>
      </CardContent>
    </Card>
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

  const [nuevaAbierta, setNuevaAbierta] = useState(false);
  const [filtro, setFiltro] = useState<string>("all");

  const turnosVisibles = useMemo(
    () => turnos.filter((x) => x.activo || familias.some((f) => f.turnoId === x.id)),
    [turnos, familias]
  );
  // Si el turno elegido ya no existe (otra entrega), se vuelve a "todos".
  const turnoFiltro = turnosVisibles.find((x) => x.id === filtro)?.id ?? "all";
  const filtrando = turnoFiltro !== "all";
  const familiasVista = useMemo(
    () => (filtrando ? familias.filter((f) => f.turnoId === turnoFiltro) : familias),
    [familias, filtrando, turnoFiltro]
  );
  // Los costos son de toda la entrega, no de un turno.
  const t = useMemo(() => totalesEntrega(familiasVista, filtrando ? [] : gastos), [familiasVista, filtrando, gastos]);
  const totalGeneral = useMemo(() => totalesEntrega(familias, []), [familias]);
  const porTurno = useMemo(
    () => resumenPorTurno(turnosVisibles.map((x) => x.id), familias),
    [turnosVisibles, familias]
  );
  const datosGrafico = turnosVisibles.map((x, i) => ({
    id: x.id,
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
        acciones={
          <Button onClick={() => setNuevaAbierta(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nueva entrega
          </Button>
        }
      />

      {!loading && entregas.length === 0 ? (
        <SinEntrega entregas={entregas} onCreada={onEntregaCreada} />
      ) : (
        <div className="space-y-5">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
            <Chip active={!filtrando} onClick={() => setFiltro("all")}>Todos los turnos</Chip>
            {turnosVisibles.map((x) => (
              <Chip key={x.id} active={turnoFiltro === x.id} onClick={() => setFiltro(x.id)}>
                {x.hora}
              </Chip>
            ))}
          </div>

          <div>
            <EtiquetaSeccion>Cuánta gente viene</EtiquetaSeccion>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              <Dato grande titulo="Familias" valor={t.familias.toString()} />
              <Dato grande titulo="Personas en total" valor={t.personas.toString()} detalle="con los alumnos" />
              <Dato grande titulo="Total alumnos" valor={t.chicos.toString()} detalle="una copa por alumno" />
              <Dato
                grande
                titulo="Alumn. Masculinos"
                valor={t.masculino.toString()}
                className="bg-blue-500/10 text-blue-700"
              />
              <Dato
                grande
                titulo="Alumn. Femenino"
                valor={t.femenino.toString()}
                className="bg-pink-500/10 text-pink-700"
              />
            </div>
          </div>

          <div>
            <EtiquetaSeccion>Alumnos por turno</EtiquetaSeccion>
            <div className="rounded-[14px] border p-3">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-4">
                  <Punto color={COLOR_MASCULINO} texto="Masculino" />
                  <Punto color={COLOR_FEMENINO} texto="Femenino" />
                </div>
                <span className="text-sm font-bold">Total {t.chicos}</span>
              </div>
              {t.chicos === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Todavía no hay alumnos inscriptos</p>
              ) : (
                <GraficoChicos datos={datosGrafico} destacadoId={filtrando ? turnoFiltro : undefined} />
              )}
            </div>
          </div>

          {!filtrando && (
          <div className="md:hidden rounded-[18px] bg-primary p-4 text-primary-foreground">
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

          )}

          {!filtrando && (
          <div className="hidden grid-cols-3 gap-3 md:grid">
            <MetricaCard
              titulo={t.ganancia >= 0 ? "Ganancia" : "Pérdida"}
              valor={formatearMoneda(Math.abs(t.ganancia))}
              color={t.ganancia >= 0 ? "text-green-600" : "text-destructive"}
            />
            <MetricaCard titulo="Ingresos" valor={formatearMoneda(t.cobrado)} className="bg-green-500/10" />
            <MetricaCard titulo="Costos" valor={formatearMoneda(t.gastos)} className="bg-red-500/10" />
          </div>
          )}

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
            <EtiquetaSeccion>Detalle por turno</EtiquetaSeccion>
            <div className="overflow-hidden rounded-[14px] border">
              <div className="grid grid-cols-[1fr_5.5rem_5.5rem_6.5rem_6.5rem_8rem] gap-x-4 md:grid-cols-[1fr_8rem_8rem_9rem_9rem_10rem] border-b bg-muted/60 px-4 py-2 text-xs font-semibold text-muted-foreground">
                <span>Turno</span>
                <span className="text-center">Familias</span>
                <span className="text-center">Alumnos</span>
                <span className="text-center text-blue-700">Masculino</span>
                <span className="text-center text-pink-700">Femenino</span>
                <span className="text-center">Total personas</span>
              </div>
              {turnosVisibles.map((x, i) => (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => setFiltro(turnoFiltro === x.id ? "all" : x.id)}
                  className={cn(
                    "grid w-full grid-cols-[1fr_5.5rem_5.5rem_6.5rem_6.5rem_8rem] gap-x-4 md:grid-cols-[1fr_8rem_8rem_9rem_9rem_10rem] items-center border-b px-4 py-2.5 text-left text-[15px] last:border-b-0",
                    turnoFiltro === x.id ? "bg-[hsl(209_65%_95%)]" : "hover:bg-muted/40"
                  )}
                >
                  <span className="min-w-0 truncate font-semibold">
                    {x.hora}
                    {x.grupoEdad && <span className="font-normal text-muted-foreground"> · {x.grupoEdad.nombre}</span>}
                  </span>
                  <span className="text-center">{porTurno[i].familias}</span>
                  <span className="text-center">{porTurno[i].chicos}</span>
                  <span className="text-center font-semibold text-blue-700">{porTurno[i].masculino}</span>
                  <span className="text-center font-semibold text-pink-700">{porTurno[i].femenino}</span>
                  <span className="text-center font-semibold">{porTurno[i].personas}</span>
                </button>
              ))}
              <div className="grid grid-cols-[1fr_5.5rem_5.5rem_6.5rem_6.5rem_8rem] gap-x-4 md:grid-cols-[1fr_8rem_8rem_9rem_9rem_10rem] bg-muted/60 px-4 py-2.5 text-[15px] font-bold">
                <span>Total</span>
                <span className="text-center">{totalGeneral.familias}</span>
                <span className="text-center">{totalGeneral.chicos}</span>
                <span className="text-center text-blue-700">{totalGeneral.masculino}</span>
                <span className="text-center text-pink-700">{totalGeneral.femenino}</span>
                <span className="text-center">{totalGeneral.personas}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      <NuevaEntregaModal open={nuevaAbierta} onOpenChange={setNuevaAbierta} entregas={entregas} onCreada={onEntregaCreada} />
    </>
  );
}
