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
import { Plus, Pencil, Trash2, Settings2, ChevronDown } from "lucide-react";
import { MultiSelectFilter } from "@/components/shared/MultiSelectFilter";
import { InscripcionDialog } from "./InscripcionDialog";
import { GestionarTorneoDialog } from "./GestionarTorneoDialog";
import { TorneoSwitcher } from "./TorneoSwitcher";
import { NuevoTorneoButton } from "./NuevoTorneoButton";
import { useTorneoActual } from "./useTorneoActual";
import { formatearMoneda } from "@/lib/calculations";
import { colorHorario } from "@/lib/torneo";
import { cn } from "@/lib/utils";
import type { HorarioConCupo, InscripcionConHorario } from "@/lib/types";

function PagoDropdown({
  inscripcion,
  precioEfectivo,
  precioTransferencia,
  onChange,
}: {
  inscripcion: InscripcionConHorario;
  precioEfectivo: number;
  precioTransferencia: number;
  onChange: (pago: boolean, metodoPago: "EFECTIVO" | "TRANSFERENCIA" | null) => void;
}) {
  const valorActual = !inscripcion.pago
    ? "NO_PAGO"
    : inscripcion.metodoPago ?? "NO_PAGO";

  const badge: ReactNode = !inscripcion.pago ? (
    <Badge variant="outline" className="text-xs font-normal">Sin pagar</Badge>
  ) : inscripcion.metodoPago === "EFECTIVO" ? (
    <Badge variant="secondary" className="text-xs font-normal">Efectivo · {formatearMoneda(precioEfectivo)}</Badge>
  ) : (
    <Badge variant="secondary" className="text-xs font-normal">Transferencia · {formatearMoneda(precioTransferencia)}</Badge>
  );

  const onSelect = (valor: string) => {
    if (valor === "NO_PAGO") onChange(false, null);
    else onChange(true, valor as "EFECTIVO" | "TRANSFERENCIA");
  };

  return (
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
  );
}

function HorarioDropdown({
  inscripcion,
  horarios,
  onChange,
}: {
  inscripcion: InscripcionConHorario;
  horarios: HorarioConCupo[];
  onChange: (horarioId: string) => void;
}) {
  const color = colorHorario(inscripcion.horario.orden);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded -mx-1 px-1 py-0.5 hover:bg-muted"
          >
            <Badge className={cn("text-xs font-normal border-transparent", color.pill)}>
              {inscripcion.horario.hora} — {inscripcion.horario.grupoEdad.nombre}
            </Badge>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
        }
      />
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup value={inscripcion.horarioId} onValueChange={onChange}>
          {horarios.filter((h) => h.activo).map((h) => (
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

export function InscripcionesTable({ torneoIdInicial }: { torneoIdInicial?: string }) {
  const { torneos, torneoId, torneoActual, seleccionarTorneo, recargarTorneos } = useTorneoActual(torneoIdInicial);

  const [inscripciones, setInscripciones] = useState<InscripcionConHorario[]>([]);
  const [horarios, setHorarios] = useState<HorarioConCupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [gestionarOpen, setGestionarOpen] = useState(false);
  const [editando, setEditando] = useState<InscripcionConHorario | null>(null);
  const [filtroHorario, setFiltroHorario] = useState<string[]>([]);

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

  const inscripcionesFiltradas = useMemo(() => {
    if (filtroHorario.length === 0) return inscripciones;
    return inscripciones.filter((i) => filtroHorario.includes(i.horarioId));
  }, [inscripciones, filtroHorario]);

  const abrirNueva = () => {
    setEditando(null);
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
    metodoPago: "EFECTIVO" | "TRANSFERENCIA" | null
  ) => {
    setInscripciones((prev) =>
      prev.map((x) => (x.id === i.id ? { ...x, pago, metodoPago } : x))
    );
    await fetch(`/api/torneo/inscripciones/${i.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pago, metodoPago }),
    });
  };

  const onTorneoCreado = async (id: string) => {
    await recargarTorneos();
    seleccionarTorneo(id);
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
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <TorneoSwitcher
            torneos={torneos}
            torneoId={torneoId}
            onSelect={seleccionarTorneo}
          />
          <MultiSelectFilter
            label="Horario"
            placeholderTodos="Todos"
            options={opcionesHorario}
            selected={filtroHorario}
            onChange={setFiltroHorario}
            className="w-56"
          />
        </div>
        <div className="flex gap-2">
          <NuevoTorneoButton torneos={torneos} onCreated={onTorneoCreado} />
          <Button variant="outline" onClick={() => setGestionarOpen(true)} disabled={!torneoId}>
            <Settings2 className="h-4 w-4 mr-1.5" />
            Gestionar torneo
          </Button>
          <Button onClick={abrirNueva} disabled={!torneoId}>
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Edad</TableHead>
              <TableHead>Horario</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead>Equipo</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Cargando...</TableCell></TableRow>
            ) : inscripcionesFiltradas.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sin inscripciones</TableCell></TableRow>
            ) : (
              inscripcionesFiltradas.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.nombre}</TableCell>
                  <TableCell>{i.edad} años</TableCell>
                  <TableCell>
                    <HorarioDropdown
                      inscripcion={i}
                      horarios={horarios}
                      onChange={(horarioId) => cambiarHorario(i, horarioId)}
                    />
                  </TableCell>
                  <TableCell>
                    <PagoDropdown
                      inscripcion={i}
                      precioEfectivo={torneoActual?.precioEfectivo ?? 18000}
                      precioTransferencia={torneoActual?.precioTransferencia ?? 22000}
                      onChange={(pago, metodoPago) => cambiarPago(i, pago, metodoPago)}
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
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirEditar(i)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => eliminar(i)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <InscripcionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        inscripcion={editando}
        horarios={horarios}
        onSuccess={() => { setDialogOpen(false); cargar(); }}
      />
      <GestionarTorneoDialog
        open={gestionarOpen}
        onOpenChange={setGestionarOpen}
        torneo={torneoActual}
        horarios={horarios}
        onUpdate={onTorneoActualizado}
      />
    </div>
  );
}
