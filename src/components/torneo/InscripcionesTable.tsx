"use client";

import { useState, useEffect, useMemo, useCallback, type ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Plus, Pencil, Trash2, Settings2, ChevronDown, Save, X, ArrowRightLeft, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MultiSelectFilter } from "@/components/shared/MultiSelectFilter";
import { SearchSelectFilter } from "@/components/shared/SearchSelectFilter";
import { usePlegados } from "@/components/shared/usePlegados";
import { InscripcionDialog } from "./InscripcionDialog";
import { GestionarTorneoDialog } from "./GestionarTorneoDialog";
import { TorneoSwitcher } from "./TorneoSwitcher";
import { EstadoTorneoBadge } from "./EstadoTorneoBadge";
import { useTorneoActual } from "./useTorneoActual";
import { InscripcionesMobile } from "./InscripcionesMobile";
import { GestionarTorneoSheet } from "./GestionarTorneoSheet";
import { formatearMoneda } from "@/lib/calculations";
import { colorHorario, montoPorMetodoPago } from "@/lib/torneo";
import { cn } from "@/lib/utils";
import { PILL_PAGO, PILL_SIN_PAGAR } from "@/lib/estilosEstado";
import type { HorarioConCupo, InscripcionConHorario, TorneoConResumen } from "@/lib/types";

function CeldaPago({
  inscripcion,
  torneo,
  onChange,
}: {
  inscripcion: InscripcionConHorario;
  torneo: TorneoConResumen | null;
  onChange: (pago: boolean, metodoPago: "EFECTIVO" | "TRANSFERENCIA" | null, monto: number | null) => void;
}) {
  const [editandoMonto, setEditandoMonto] = useState(false);
  const [montoInput, setMontoInput] = useState("");

  const precioEfectivo = torneo?.precioEfectivo ?? 18000;
  const precioTransferencia = torneo?.precioTransferencia ?? 22000;

  const valorActual = !inscripcion.pago ? "NO_PAGO" : inscripcion.metodoPago ?? "NO_PAGO";

  const badge: ReactNode = !inscripcion.pago ? (
    <Badge className={cn("text-xs font-normal", PILL_SIN_PAGAR)}>Sin pagar</Badge>
  ) : (
    <Badge className={cn("text-xs font-normal", PILL_PAGO)}>
      {inscripcion.metodoPago === "EFECTIVO" ? "Efectivo" : "Transferencia"} · {formatearMoneda(inscripcion.monto ?? 0)}
    </Badge>
  );

  const onSelect = (valor: string) => {
    if (valor === "NO_PAGO") {
      onChange(false, null, null);
    } else {
      const metodoPago = valor as "EFECTIVO" | "TRANSFERENCIA";
      onChange(true, metodoPago, montoPorMetodoPago({ precioEfectivo, precioTransferencia }, metodoPago));
    }
  };

  const empezarEdicion = () => {
    setMontoInput((inscripcion.monto ?? 0).toString());
    setEditandoMonto(true);
  };

  const guardarMonto = () => {
    onChange(true, inscripcion.metodoPago ?? "EFECTIVO", parseInt(montoInput) || 0);
    setEditandoMonto(false);
  };

  if (editandoMonto) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min="0"
          value={montoInput}
          onChange={(e) => setMontoInput(e.target.value)}
          className="h-7 w-24 text-sm"
          autoFocus
        />
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={guardarMonto}>
          <Save className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditandoMonto(false)}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded -mx-1 px-1 py-0.5 hover:bg-muted"
            >
              {badge}
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
          }
        />
        <DropdownMenuContent align="start">
          <DropdownMenuRadioGroup value={valorActual} onValueChange={onSelect}>
            <DropdownMenuRadioItem value="NO_PAGO" closeOnClick>Sin pagar</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="EFECTIVO" closeOnClick>Efectivo · {formatearMoneda(precioEfectivo)}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="TRANSFERENCIA" closeOnClick>Transferencia · {formatearMoneda(precioTransferencia)}</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {inscripcion.pago && (
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={empezarEdicion} title="Editar monto">
          <Pencil className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

// Pasa la inscripcion a otro horario sin abrir la edicion.
function MoverHorario({
  inscripcion,
  horarios,
  onChange,
}: {
  inscripcion: InscripcionConHorario;
  horarios: HorarioConCupo[];
  onChange: (horarioId: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Mover a otro horario">
            <ArrowRightLeft className="h-3.5 w-3.5" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={inscripcion.horarioId} onValueChange={onChange}>
          {horarios.filter((h) => h.activo || h.id === inscripcion.horarioId).map((h) => (
            <DropdownMenuRadioItem key={h.id} value={h.id} closeOnClick>
              {h.hora} — {h.grupoEdad.nombre}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CupoKpiCard({ horario }: { horario: HorarioConCupo }) {
  const lleno = horario.cupoMaximo != null && horario.inscriptos >= horario.cupoMaximo;
  const color = colorHorario(horario.orden);
  return (
    <Card className={cn(color.kpi, lleno && "border-destructive/40")}>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {horario.hora} — {horario.grupoEdad.nombre}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-bold ${lleno ? "text-destructive" : ""}`}>
          {horario.inscriptos}
          {horario.cupoMaximo != null && (
            <span className="text-base font-normal text-muted-foreground">/{horario.cupoMaximo}</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          alumnos{!horario.activo && " · inactivo"}
        </p>
      </CardContent>
    </Card>
  );
}

export function InscripcionesTable({
  torneoIdInicial,
  abrirGestionarInicial,
}: {
  torneoIdInicial?: string;
  abrirGestionarInicial?: boolean;
}) {
  const { torneos, torneoId, torneoActual, seleccionarTorneo, recargarTorneos } = useTorneoActual(torneoIdInicial);

  const [inscripciones, setInscripciones] = useState<InscripcionConHorario[]>([]);
  const [horarios, setHorarios] = useState<HorarioConCupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [gestionarOpen, setGestionarOpen] = useState(false);
  const [gestionarMobileOpen, setGestionarMobileOpen] = useState(false);
  const [editando, setEditando] = useState<InscripcionConHorario | null>(null);
  const [horarioNuevaId, setHorarioNuevaId] = useState<string | undefined>();
  const { plegados, alternar: alternarPlegado, plegarTodos, desplegarTodos } = usePlegados(
    "torneo-inscripciones-plegados"
  );
  const [filtroHorario, setFiltroHorario] = useState<string[]>([]);
  const [filtroNombre, setFiltroNombre] = useState<string[]>([]);

  // "Gestionar torneo" desde Mas (mobile): /torneo/inscripciones?gestionar=1
  useEffect(() => {
    if (!abrirGestionarInicial || !torneoId) return;
    const esDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (esDesktop) setGestionarOpen(true);
    else setGestionarMobileOpen(true);
  }, [abrirGestionarInicial, torneoId]);

  const cargar = useCallback(async () => {
    if (!torneoId) return;
    setLoading(true);
    const [resInscripciones, resHorarios] = await Promise.all([
      fetch(`/api/torneo/inscripciones?torneoId=${torneoId}`),
      fetch(`/api/torneo/horarios?torneoId=${torneoId}`),
    ]);
    setInscripciones(await resInscripciones.json());
    setHorarios(await resHorarios.json());
    setLoading(false);
  }, [torneoId]);

  useEffect(() => {
    setFiltroHorario([]);
    setFiltroNombre([]);
    cargar();
  }, [cargar]);

  const onTorneoActualizado = async () => {
    await recargarTorneos();
    cargar();
  };

  const opcionesHorario = useMemo(
    () => horarios.map((h) => ({ value: h.id, label: `${h.hora} — ${h.grupoEdad.nombre}` })),
    [horarios]
  );

  const opcionesNombre = useMemo(
    () =>
      Array.from(new Set(inscripciones.map((i) => i.nombre)))
        .sort((a, b) => a.localeCompare(b))
        .map((nombre) => ({ value: nombre, label: nombre })),
    [inscripciones]
  );

  const inscripcionesFiltradas = useMemo(() => {
    return inscripciones.filter((i) => {
      const pasaHorario = filtroHorario.length === 0 || filtroHorario.includes(i.horarioId);
      const pasaNombre = filtroNombre.length === 0 || filtroNombre.includes(i.nombre);
      return pasaHorario && pasaNombre;
    });
  }, [inscripciones, filtroHorario, filtroNombre]);

  // Un bloque por horario. Con filtro de nombre solo quedan los que tienen coincidencias.
  const horariosVisibles = useMemo(
    () =>
      horarios.filter((h) => {
        if (filtroHorario.length > 0) return filtroHorario.includes(h.id);
        if (filtroNombre.length > 0) return inscripcionesFiltradas.some((i) => i.horarioId === h.id);
        return h.activo || h.inscriptos > 0;
      }),
    [horarios, filtroHorario, filtroNombre, inscripcionesFiltradas]
  );

  const abrirNueva = (horarioId?: string) => {
    setEditando(null);
    setHorarioNuevaId(horarioId);
    setDialogOpen(true);
  };

  const abrirEditar = (i: InscripcionConHorario) => {
    setEditando(i);
    setDialogOpen(true);
  };

  const eliminar = async (i: InscripcionConHorario) => {
    if (!confirm(`¿Eliminar la inscripción de ${i.nombre}?`)) return;
    await fetch(`/api/torneo/inscripciones/${i.id}`, { method: "DELETE" });
    cargar();
  };

  const cambiarPago = async (
    i: InscripcionConHorario,
    pago: boolean,
    metodoPago: "EFECTIVO" | "TRANSFERENCIA" | null,
    monto: number | null
  ) => {
    setInscripciones((prev) =>
      prev.map((x) => (x.id === i.id ? { ...x, pago, metodoPago, monto } : x))
    );
    await fetch(`/api/torneo/inscripciones/${i.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pago, metodoPago, monto }),
    });
    recargarTorneos();
  };

  const cambiarHorario = async (i: InscripcionConHorario, horarioId: string) => {
    if (horarioId === i.horarioId) return;
    const nuevoHorario = horarios.find((h) => h.id === horarioId);
    if (!nuevoHorario) return;

    setInscripciones((prev) =>
      prev.map((x) =>
        x.id === i.id
          ? { ...x, horarioId, horario: nuevoHorario, equipo: null, equipoAsignadoAt: null }
          : x
      )
    );
    await fetch(`/api/torneo/inscripciones/${i.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ horarioId }),
    });
    cargar();
  };

  return (
    <>
    <div className="hidden md:block">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <TorneoSwitcher
            torneos={torneos}
            torneoId={torneoId}
            onSelect={seleccionarTorneo}
          />
          <SearchSelectFilter
            label="Nombre"
            placeholder="Buscar alumno..."
            options={opcionesNombre}
            selected={filtroNombre}
            onChange={setFiltroNombre}
            className="w-56"
          />
          <MultiSelectFilter
            label="Horario"
            placeholderTodos="Todos"
            options={opcionesHorario}
            selected={filtroHorario}
            onChange={setFiltroHorario}
            className="w-56"
          />
          <EstadoTorneoBadge torneo={torneoActual} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setGestionarOpen(true)} disabled={!torneoId}>
            <Settings2 className="h-4 w-4 mr-1.5" />
            Gestionar torneo
          </Button>
          <Button onClick={() => abrirNueva()} disabled={!torneoId}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nueva inscripción
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
        {horarios.map((h) => (
          <CupoKpiCard key={h.id} horario={h} />
        ))}
      </div>

      {loading ? (
        <p className="py-8 text-center text-muted-foreground">Cargando...</p>
      ) : horariosVisibles.length === 0 ? (
        <p className="rounded-md border py-8 text-center text-muted-foreground">Sin inscripciones</p>
      ) : (
        <div className="space-y-6">
          <div className="-mb-3 -ml-2 flex justify-start">
            {horariosVisibles.every((h) => plegados.includes(h.id)) ? (
              <Button variant="ghost" size="sm" onClick={desplegarTodos}>
                <ChevronsUpDown className="mr-1 h-3.5 w-3.5" />
                Desplegar todos
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => plegarTodos(horariosVisibles.map((h) => h.id))}>
                <ChevronsDownUp className="mr-1 h-3.5 w-3.5" />
                Plegar todos
              </Button>
            )}
          </div>
          {horariosVisibles.map((h) => {
            const plegado = plegados.includes(h.id);
            const delHorario = inscripcionesFiltradas.filter((i) => i.horarioId === h.id);
            const todas = inscripciones.filter((i) => i.horarioId === h.id);
            const pagaron = todas.filter((i) => i.pago);
            const cobrado = pagaron.reduce((s, i) => s + (i.monto ?? 0), 0);
            const lleno = h.cupoMaximo != null && h.inscriptos >= h.cupoMaximo;
            return (
              <section key={h.id}>
                <div className={cn("flex items-center justify-between gap-2", !plegado && "mb-2")}>
                  <button
                    type="button"
                    onClick={() => alternarPlegado(h.id)}
                    aria-expanded={!plegado}
                    className="-ml-2 flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-2 py-1 text-left hover:bg-muted/60"
                  >
                    <ChevronDown
                      className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", plegado && "-rotate-90")}
                    />
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colorHorario(h.orden).hex }} />
                    <div className="min-w-0">
                      <div className="text-[15px] font-bold">
                        {h.hora}
                        <span className="font-medium text-muted-foreground"> · {h.grupoEdad.nombre}</span>
                        {!h.activo && <span className="font-medium text-muted-foreground"> · inactivo</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <span className={cn(lleno && "font-semibold text-destructive")}>
                          {h.inscriptos}
                          {h.cupoMaximo != null && `/${h.cupoMaximo}`} inscriptos
                        </span>
                        {" · "}
                        {pagaron.length} pagaron · cobrado {formatearMoneda(cobrado)}
                      </div>
                    </div>
                  </button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => abrirNueva(h.id)}
                    title={`Inscribir en el horario de las ${h.hora}`}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {plegado ? null : delHorario.length === 0 ? (
                  <p className="rounded-md border border-dashed px-4 py-3 text-sm text-muted-foreground">
                    Sin inscripciones en este horario
                  </p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Edad</TableHead>
                          <TableHead>Pago</TableHead>
                          <TableHead>Equipo</TableHead>
                          <TableHead className="w-32"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {delHorario.map((i) => (
                          <TableRow key={i.id}>
                            <TableCell className="font-medium">
                              <button type="button" onClick={() => abrirEditar(i)} className="text-left hover:underline">
                                {i.nombre}
                              </button>
                            </TableCell>
                            <TableCell>{i.edad || <span className="text-muted-foreground">—</span>}</TableCell>
                            <TableCell>
                              <CeldaPago
                                inscripcion={i}
                                torneo={torneoActual}
                                onChange={(pago, metodoPago, monto) => cambiarPago(i, pago, metodoPago, monto)}
                              />
                            </TableCell>
                            <TableCell>
                              {i.equipo ? (
                                <Badge variant="outline" className="capitalize">{i.equipo.toLowerCase()}</Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">Sin asignar</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 justify-end">
                                <MoverHorario
                                  inscripcion={i}
                                  horarios={horarios}
                                  onChange={(horarioId) => cambiarHorario(i, horarioId)}
                                />
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirEditar(i)} title="Editar">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => eliminar(i)} title="Eliminar">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>

    <div className="md:hidden">
      <InscripcionesMobile
        key={torneoId}
        torneos={torneos}
        torneoId={torneoId}
        torneoActual={torneoActual}
        seleccionarTorneo={seleccionarTorneo}
        inscripciones={inscripciones}
        setInscripciones={setInscripciones}
        horarios={horarios}
        loading={loading}
        cargar={cargar}
        recargarTorneos={recargarTorneos}
        onGestionar={() => setGestionarMobileOpen(true)}
      />
    </div>

      <InscripcionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        inscripcion={editando}
        horarios={horarios}
        torneo={torneoActual}
        horarioInicialId={horarioNuevaId}
        onSuccess={() => { setDialogOpen(false); cargar(); recargarTorneos(); }}
      />
      <GestionarTorneoSheet
        open={gestionarMobileOpen}
        onOpenChange={setGestionarMobileOpen}
        torneo={torneoActual}
        horarios={horarios}
        onUpdate={onTorneoActualizado}
      />
      <GestionarTorneoDialog
        open={gestionarOpen}
        onOpenChange={setGestionarOpen}
        torneo={torneoActual}
        horarios={horarios}
        onUpdate={onTorneoActualizado}
      />
    </>
  );
}
