"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Settings2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFetchJson } from "@/components/shared/useFetchJson";
import { useToast } from "@/components/mobile/ToastUndo";
import { Chip, Fab, SwitchGrande } from "@/components/mobile/ui";
import { formatearMoneda } from "@/lib/calculations";
import { montoBono, normalizarNombre, resumenPorTurno, totalesEntrega, type MetodoPago } from "@/lib/premios";
import type { FamiliaConChicos, TurnoConConteo } from "@/lib/types";
import { ModalResponsivo } from "@/components/shared/ModalResponsivo";
import { SearchSelectFilter } from "@/components/shared/SearchSelectFilter";
import { EncabezadoPremios, SinEntrega } from "./EncabezadoPremios";
import { FamiliasTurnoTabla } from "./FamiliasTurnoTabla";
import { FamiliaModal } from "./FamiliaModal";
import { GestionarEntregaModal } from "./GestionarEntregaModal";
import { useEntregaActual } from "./useEntregaActual";

const SIN_TURNOS: TurnoConConteo[] = [];
const SIN_FAMILIAS: FamiliaConChicos[] = [];

const textoPago = (f: FamiliaConChicos) =>
  f.metodoPago
    ? `${f.metodoPago === "TRANSFERENCIA" ? "Transf." : "Efectivo"} · ${formatearMoneda(f.monto)}`
    : `Sin pagar · ${formatearMoneda(f.monto)}`;

function Kpi({ titulo, valor, detalle, className }: { titulo: string; valor: string; detalle?: string; className: string }) {
  return (
    <div className={cn("rounded-xl px-3 py-2", className)}>
      <div className="text-[11px] font-medium opacity-80">{titulo}</div>
      <div className="text-[18px] font-bold leading-tight">{valor}</div>
      {detalle && <div className="text-[11px] opacity-80">{detalle}</div>}
    </div>
  );
}

export function InscripcionesPremios({
  entregaIdInicial,
  abrirGestionarInicial,
}: {
  entregaIdInicial?: string;
  abrirGestionarInicial?: boolean;
}) {
  const toast = useToast();
  const { entregas, entregaId, entregaActual, seleccionarEntrega, loading, recargarEntregas } =
    useEntregaActual(entregaIdInicial);
  const { data: turnos, recargar: recargarTurnos } = useFetchJson<TurnoConConteo[]>(
    entregaId ? `/api/premios/turnos?entregaId=${entregaId}` : null,
    SIN_TURNOS
  );
  const { data: familias, loading: cargandoFamilias, recargar: recargarFamilias } = useFetchJson<FamiliaConChicos[]>(
    entregaId ? `/api/premios/familias?entregaId=${entregaId}` : null,
    SIN_FAMILIAS
  );

  // "Gestionar entrega" desde Mas (mobile): /premios/inscripciones?gestionar=1;
  // el modal espera a que la entrega este cargada.
  const [gestionarOpen, setGestionarOpen] = useState(!!abrirGestionarInicial);
  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState<FamiliaConChicos | null>(null);
  const [turnoInicialId, setTurnoInicialId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filtroTurno, setFiltroTurno] = useState<string>("all");
  const [filtroNombre, setFiltroNombre] = useState<string[]>([]);

  const totales = useMemo(() => totalesEntrega(familias, []), [familias]);
  const porTurno = useMemo(
    () => resumenPorTurno(turnos.map((t) => t.id), familias),
    [turnos, familias]
  );

  const opcionesNombre = useMemo(
    () =>
      Array.from(new Set(familias.flatMap((f) => [f.nombre, ...f.chicos.map((c) => c.nombre)])))
        .sort((a, b) => a.localeCompare(b))
        .map((n) => ({ value: n, label: n })),
    [familias]
  );

  const visibles = useMemo(() => {
    const busqueda = normalizarNombre(q);
    return familias.filter((f) => {
      if (filtroTurno !== "all" && f.turnoId !== filtroTurno) return false;
      if (filtroNombre.length > 0 && ![f.nombre, ...f.chicos.map((c) => c.nombre)].some((n) => filtroNombre.includes(n))) return false;
      if (!busqueda) return true;
      return [f.nombre, ...f.chicos.map((c) => c.nombre)].some((n) => normalizarNombre(n).includes(busqueda));
    });
  }, [familias, q, filtroTurno, filtroNombre]);

  const refrescar = async () => {
    await Promise.all([recargarFamilias(), recargarTurnos(), recargarEntregas()]);
  };

  const [cobrando, setCobrando] = useState<FamiliaConChicos | null>(null);

  const abrirNueva = (turnoId?: string) => {
    setEditando(null);
    setTurnoInicialId(turnoId ?? (filtroTurno !== "all" ? filtroTurno : null));
    setFormAbierto(true);
  };

  const abrirEditar = (f: FamiliaConChicos) => {
    setEditando(f);
    setFormAbierto(true);
  };

  const patchFamilia = async (id: string, cambios: { metodoPago?: MetodoPago | null; monto?: number }) => {
    const res = await fetch(`/api/premios/familias/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cambios),
    });
    return res.ok;
  };

  // Cobro rapido. El monto sigue al medio de pago salvo que la familia tenga
  // un monto de excepcion.
  const cambiarPago = async (f: FamiliaConChicos, metodo: MetodoPago | null) => {
    if (!entregaActual) return;
    const esExcepcion = f.monto !== montoBono(entregaActual, f.metodoPago);
    const anterior = { metodoPago: f.metodoPago, monto: f.monto };
    const nuevo = { metodoPago: metodo, monto: esExcepcion ? f.monto : montoBono(entregaActual, metodo) };
    if (!(await patchFamilia(f.id, nuevo))) return toast("No se pudo guardar el pago");
    await refrescar();
    toast(
      metodo ? `${f.nombre} · pagó (${metodo === "EFECTIVO" ? "efectivo" : "transferencia"})` : `${f.nombre} · sin pagar`,
      async () => {
        if (!(await patchFamilia(f.id, anterior))) toast("No se pudo deshacer");
        await refrescar();
      }
    );
  };

  const editarMonto = async (f: FamiliaConChicos, monto: number) => {
    if (!(await patchFamilia(f.id, { monto }))) return toast("No se pudo guardar el monto");
    await refrescar();
  };

  const eliminar = async (f: FamiliaConChicos) => {
    const res = await fetch(`/api/premios/familias/${f.id}`, { method: "DELETE" });
    if (!res.ok) return toast("No se pudo eliminar la familia");
    await refrescar();
    toast(`${f.nombre} eliminada`, async () => {
      const r = await fetch("/api/premios/familias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turnoId: f.turnoId,
          nombre: f.nombre,
          telefono: f.telefono,
          totalPersonas: f.totalPersonas,
          metodoPago: f.metodoPago,
          monto: f.monto,
          chicos: f.chicos.map((c) => ({ nombre: c.nombre, genero: c.genero })),
        }),
      });
      if (!r.ok) toast("No se pudo deshacer");
      await refrescar();
    });
  };

  const onEntregaActualizada = async () => {
    await Promise.all([recargarEntregas(), recargarTurnos(), recargarFamilias()]);
  };

  const onEntregaCreada = async (id: string) => {
    await recargarEntregas();
    seleccionarEntrega(id);
  };

  const sinEntregas = !loading && entregas.length === 0;

  return (
    <>
      <EncabezadoPremios
        titulo="Inscripciones"
        descripcion="Anotá a las familias por turno: alumnos, personas y bono"
        entregas={entregas}
        entregaId={entregaId}
        onSelect={seleccionarEntrega}
        filtroTurno={{ turnos: turnos.filter((t) => t.activo), value: filtroTurno, onChange: setFiltroTurno }}
        filtros={
          <SearchSelectFilter
            label="Familia o alumno"
            placeholder="Buscar..."
            options={opcionesNombre}
            selected={filtroNombre}
            onChange={setFiltroNombre}
            className="w-56"
          />
        }
        acciones={
          <>
            <Button variant="outline" onClick={() => setGestionarOpen(true)} disabled={!entregaId}>
              <Settings2 className="mr-1.5 h-4 w-4" />
              Gestionar entrega
            </Button>
            <Button onClick={() => abrirNueva()} disabled={!entregaId}>
              <Plus className="mr-1.5 h-4 w-4" />
              Nueva inscripción
            </Button>
          </>
        }
      />

      {sinEntregas ? (
        <SinEntrega entregas={entregas} onCreada={onEntregaCreada} />
      ) : (
        <>
          <div className="sticky top-0 z-10 -mx-4 border-b bg-background px-4 pb-2.5 pt-1 md:static md:mx-0 md:border-0 md:px-0">
            <div className="mb-2 grid grid-cols-2 gap-2 md:grid-cols-4">
              <Kpi
                titulo={`Cobrado · ${totales.familiasPagaron} de ${totales.familias}`}
                valor={formatearMoneda(totales.cobrado)}
                className="bg-[hsl(150_50%_94%)] text-[hsl(152_55%_24%)]"
              />
              <Kpi
                titulo={`Falta cobrar · ${totales.familias - totales.familiasPagaron}`}
                valor={formatearMoneda(totales.pendiente)}
                className="bg-[hsl(30_90%_94%)] text-[hsl(25_75%_28%)]"
              />
              <Kpi
                titulo="Total alumnos"
                valor={totales.chicos.toString()}
                detalle={`${totales.masculino} masc. · ${totales.femenino} fem.`}
                className="bg-[hsl(209_65%_95%)] text-primary"
              />
              <Kpi
                titulo="Personas"
                valor={totales.personas.toString()}
                detalle={`${totales.familias} familia${totales.familias === 1 ? "" : "s"}`}
                className="bg-muted text-foreground"
              />
            </div>

            <div className="mb-2 flex h-11 items-center gap-2 rounded-xl bg-muted px-3 md:hidden">
              <Search className="h-[18px] w-[18px] text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar familia o alumno..."
                className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
              />
            </div>

            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] md:hidden">
              <Chip active={filtroTurno === "all"} onClick={() => setFiltroTurno("all")}>Todos los turnos</Chip>
              {turnos.filter((t) => t.activo).map((t) => (
                <Chip key={t.id} active={filtroTurno === t.id} onClick={() => setFiltroTurno(t.id)}>
                  {t.hora}
                  {t.grupoEdad ? ` · ${t.grupoEdad.nombre}` : ""}
                </Chip>
              ))}
            </div>
          </div>

          <div className="mt-3 space-y-5">
            {loading || cargandoFamilias ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Cargando...</p>
            ) : (
              turnos
                .filter((t) => (filtroTurno === "all" ? t.activo || visibles.some((f) => f.turnoId === t.id) : t.id === filtroTurno))
                .map((t) => {
                  const delTurno = visibles.filter((f) => f.turnoId === t.id);
                  const r = porTurno.find((x) => x.turnoId === t.id);
                  return (
                    <section key={t.id}>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[15px] font-bold">
                            {t.hora}
                            {t.grupoEdad && <span className="font-medium text-muted-foreground"> · {t.grupoEdad.nombre}</span>}
                            {!t.activo && <span className="font-medium text-muted-foreground"> · inactivo</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {r?.familias ?? 0} familia{r?.familias === 1 ? "" : "s"} · {r?.chicos ?? 0} alumnos ({r?.masculino ?? 0} masc. / {r?.femenino ?? 0} fem.) · {r?.personas ?? 0} personas
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => abrirNueva(t.id)}
                          aria-label={`Inscribir en el turno de las ${t.hora}`}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      {delTurno.length === 0 ? (
                        <p className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
                          {q ? "Sin coincidencias" : "Sin familias en este turno"}
                        </p>
                      ) : (
                        <>
                        <div className="hidden md:block">
                          <FamiliasTurnoTabla
                            entrega={entregaActual}
                            familias={delTurno}
                            onEditar={abrirEditar}
                            onEliminar={eliminar}
                            onCambiarPago={cambiarPago}
                            onEditarMonto={editarMonto}
                          />
                        </div>
                        <div className="grid gap-2 md:hidden">
                          {delTurno.map((f) => (
                            <div key={f.id} className="flex items-center gap-3 rounded-[14px] border px-3 py-2">
                              <div className="min-w-0 flex-1">
                                <button type="button" onClick={() => abrirEditar(f)} className="flex w-full items-baseline gap-2 text-left">
                                  <span className="min-w-0 truncate text-[15px] font-semibold">{f.nombre}</span>
                                  <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                                    <Users className="h-3.5 w-3.5" />
                                    {f.totalPersonas}
                                  </span>
                                  {f.telefono && <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{f.telefono}</span>}
                                </button>
                                <div className="mt-1 flex items-center gap-1.5">
                                  <button type="button" onClick={() => abrirEditar(f)} className="flex min-w-0 flex-1 gap-1 overflow-hidden text-left">
                                    {f.chicos.map((c) => (
                                      <span
                                        key={c.id}
                                        className={cn(
                                          "shrink-0 truncate rounded-full px-2 py-0.5 text-xs font-semibold",
                                          c.genero === "MASCULINO" ? "bg-blue-500/15 text-blue-700" : "bg-pink-500/15 text-pink-700"
                                        )}
                                      >
                                        {c.nombre}
                                      </span>
                                    ))}
                                  </button>
                                  <button type="button" onClick={() => setCobrando(f)} aria-label={`Cambiar el pago de ${f.nombre}`} className="shrink-0">
                                    <span
                                      className={cn(
                                        "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold",
                                        f.metodoPago
                                          ? "bg-[hsl(150_50%_92%)] text-[hsl(152_55%_24%)]"
                                          : "border border-[hsl(30_80%_78%)] bg-background text-[hsl(25_75%_32%)]"
                                      )}
                                    >
                                      {textoPago(f)}
                                    </span>
                                  </button>
                                </div>
                              </div>
                              <SwitchGrande
                                checked={f.metodoPago !== null}
                                label={`Pago de la familia ${f.nombre}`}
                                onChange={() => (f.metodoPago ? cambiarPago(f, null) : setCobrando(f))}
                              />
                            </div>
                          ))}
                        </div>
                        </>
                      )}
                    </section>
                  );
                })
            )}
          </div>
        </>
      )}

      <Fab onClick={() => abrirNueva()} disabled={!entregaId}>
        <Plus className="h-5 w-5" />
        Inscribir
      </Fab>

      <ModalResponsivo
        open={!!cobrando}
        onOpenChange={(v) => !v && setCobrando(null)}
        title={cobrando ? `Pago · ${cobrando.nombre}` : "Pago"}
        className="sm:max-w-sm"
      >
        {cobrando && entregaActual && (
          <div className="space-y-2.5">
            {(["EFECTIVO", "TRANSFERENCIA"] as const).map((m) => {
              const esExcepcion = cobrando.monto !== montoBono(entregaActual, cobrando.metodoPago);
              const monto = esExcepcion ? cobrando.monto : montoBono(entregaActual, m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    const f = cobrando;
                    setCobrando(null);
                    if (f.metodoPago !== m) cambiarPago(f, m);
                  }}
                  className={cn(
                    "flex min-h-14 w-full items-center justify-between rounded-xl px-4 text-left md:min-h-10 md:rounded-lg",
                    cobrando.metodoPago === m ? "bg-[hsl(209_65%_95%)] ring-2 ring-primary" : "bg-muted/60"
                  )}
                >
                  <span className="text-[15px] font-semibold">{m === "EFECTIVO" ? "Efectivo" : "Transferencia"}</span>
                  <span className="text-[15px] font-bold">{formatearMoneda(monto)}</span>
                </button>
              );
            })}
            {cobrando.metodoPago && (
              <button
                type="button"
                onClick={() => {
                  const f = cobrando;
                  setCobrando(null);
                  cambiarPago(f, null);
                }}
                className="h-12 w-full rounded-xl border text-[15px] font-semibold text-muted-foreground md:h-9 md:rounded-lg md:text-sm"
              >
                Marcar como sin pagar
              </button>
            )}
          </div>
        )}
      </ModalResponsivo>

      <FamiliaModal
        open={formAbierto}
        onOpenChange={setFormAbierto}
        entrega={entregaActual}
        turnos={turnos}
        familias={familias}
        familia={editando}
        turnoInicialId={turnoInicialId}
        onGuardada={refrescar}
        onEliminar={eliminar}
        onElegirExistente={setEditando}
      />
      <GestionarEntregaModal
        open={gestionarOpen}
        onOpenChange={setGestionarOpen}
        entrega={entregaActual}
        turnos={turnos}
        onUpdate={onEntregaActualizada}
      />
    </>
  );
}
