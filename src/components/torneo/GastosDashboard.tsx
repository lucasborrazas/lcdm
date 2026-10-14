"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Save, Pencil, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { MonedaCell } from "@/components/shared/MonedaCell";
import { TorneoSwitcher } from "./TorneoSwitcher";
import { NuevoTorneoButton } from "./NuevoTorneoButton";
import { EstadoTorneoBadge } from "./EstadoTorneoBadge";
import { useTorneoActual } from "./useTorneoActual";
import { ResumenMobile } from "./ResumenMobile";
import { formatearMoneda } from "@/lib/calculations";
import { colorHorario } from "@/lib/torneo";
import { cn } from "@/lib/utils";
import type { GastoTorneo, HorarioConCupo, InscripcionConHorario } from "@/lib/types";

function MetricaCard({
  titulo,
  valor,
  color,
  className,
}: {
  titulo: string;
  valor: string;
  color?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold ${color ?? ""}`}>{valor}</p>
      </CardContent>
    </Card>
  );
}

function FilaGasto({
  gasto,
  onSaved,
  onDeleted,
}: {
  gasto: GastoTorneo;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [concepto, setConcepto] = useState(gasto.concepto);
  const [monto, setMonto] = useState(gasto.monto.toString());
  const [guardando, setGuardando] = useState(false);

  const cambiado = concepto !== gasto.concepto || monto !== gasto.monto.toString();

  const empezarEdicion = () => {
    setConcepto(gasto.concepto);
    setMonto(gasto.monto.toString());
    setEditando(true);
  };

  const cancelar = () => {
    setConcepto(gasto.concepto);
    setMonto(gasto.monto.toString());
    setEditando(false);
  };

  const guardar = async () => {
    setGuardando(true);
    await fetch(`/api/torneo/gastos/${gasto.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ concepto, monto: parseInt(monto) || 0 }),
    });
    setGuardando(false);
    setEditando(false);
    onSaved();
  };

  const eliminar = async () => {
    if (!confirm(`¿Eliminar el costo "${gasto.concepto}"?`)) return;
    await fetch(`/api/torneo/gastos/${gasto.id}`, { method: "DELETE" });
    onDeleted();
  };

  if (editando) {
    return (
      <TableRow>
        <TableCell>
          <Input value={concepto} onChange={(e) => setConcepto(e.target.value)} className="h-8 text-sm" autoFocus />
        </TableCell>
        <TableCell className="text-right">
          <Input
            type="number"
            min="0"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="h-8 text-sm text-right"
          />
        </TableCell>
        <TableCell>
          <div className="flex gap-1 justify-end">
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!cambiado || guardando} onClick={guardar}>
              <Save className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelar}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell>{gasto.concepto}</TableCell>
      <TableCell className="text-right"><MonedaCell valor={gasto.monto} /></TableCell>
      <TableCell>
        <div className="flex gap-1 justify-end">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={empezarEdicion}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={eliminar}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function GastosDashboard({ torneoIdInicial }: { torneoIdInicial?: string }) {
  const { torneos, torneoId, torneoActual, seleccionarTorneo, recargarTorneos } = useTorneoActual(torneoIdInicial);

  const [gastos, setGastos] = useState<GastoTorneo[]>([]);
  const [horarios, setHorarios] = useState<HorarioConCupo[]>([]);
  const [inscripciones, setInscripciones] = useState<InscripcionConHorario[]>([]);
  const [loading, setLoading] = useState(true);
  const [nuevoConcepto, setNuevoConcepto] = useState("");
  const [nuevoMonto, setNuevoMonto] = useState("");

  const cargar = useCallback(async () => {
    if (!torneoId) return;
    setLoading(true);
    const [resGastos, resHorarios, resInscripciones] = await Promise.all([
      fetch(`/api/torneo/gastos?torneoId=${torneoId}`),
      fetch(`/api/torneo/horarios?torneoId=${torneoId}`),
      fetch(`/api/torneo/inscripciones?torneoId=${torneoId}`),
    ]);
    setGastos(await resGastos.json());
    setHorarios(await resHorarios.json());
    setInscripciones(await resInscripciones.json());
    setLoading(false);
  }, [torneoId]);

  useEffect(() => { cargar(); }, [cargar]);

  const onTorneoCreado = async (id: string) => {
    await recargarTorneos();
    seleccionarTorneo(id);
  };

  const agregar = async () => {
    if (!nuevoConcepto || !nuevoMonto || !torneoId) return;
    await fetch("/api/torneo/gastos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ torneoId, concepto: nuevoConcepto, monto: parseInt(nuevoMonto) }),
    });
    setNuevoConcepto("");
    setNuevoMonto("");
    await cargar();
    recargarTorneos();
  };

  const actualizar = async () => {
    await cargar();
    recargarTorneos();
  };

  const totalCostos = gastos.reduce((s, g) => s + g.monto, 0);
  const recaudado = torneoActual?.recaudado ?? 0;
  const ganancia = recaudado - totalCostos;

  const datosIngresosCostos = [
    { name: "Ingresos", value: recaudado },
    { name: "Costos", value: totalCostos },
  ];

  const datosAlumnosPorHorario = horarios.map((h) => ({
    hora: h.hora,
    nombre: h.grupoEdad.nombre,
    alumnos: h.inscriptos,
    color: colorHorario(h.orden).hex,
  }));

  return (
    <>
    <div className="hidden md:block">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div className="flex flex-wrap items-end gap-3">
          <TorneoSwitcher
            torneos={torneos}
            torneoId={torneoId}
            onSelect={seleccionarTorneo}
          />
          <EstadoTorneoBadge torneo={torneoActual} />
        </div>
        <NuevoTorneoButton torneos={torneos} onCreated={onTorneoCreado} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <MetricaCard
          titulo={ganancia >= 0 ? "Ganancia" : "Pérdida"}
          valor={formatearMoneda(Math.abs(ganancia))}
          color={ganancia >= 0 ? "text-green-600" : "text-destructive"}
        />
        <MetricaCard titulo="Ingresos" valor={formatearMoneda(recaudado)} className={cn("bg-green-500/10")} />
        <MetricaCard titulo="Costos" valor={formatearMoneda(totalCostos)} className={cn("bg-red-500/10")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Alumnos por horario</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosAlumnosPorHorario}>
                <XAxis dataKey="hora" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} width={30} allowDecimals={false} />
                <Tooltip
                  formatter={(v) => [v, "Alumnos"]}
                  labelFormatter={(label, payload) => {
                    const p = payload?.[0]?.payload as { hora: string; nombre: string } | undefined;
                    return p ? `${p.hora} — ${p.nombre}` : label;
                  }}
                />
                <Bar dataKey="alumnos" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="alumnos" position="top" style={{ fontSize: 12, fontWeight: 600, fill: "currentColor" }} />
                  {datosAlumnosPorHorario.map((d, i) => (
                    <Cell key={i} fill={d.color} fillOpacity={0.55} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ingresos vs. costos</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosIngresosCostos}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} width={70} tickFormatter={(v) => formatearMoneda(v)} />
                <Tooltip formatter={(v) => [typeof v === "number" ? formatearMoneda(v) : v, "Monto"]} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  <Cell fill="#22c55e" fillOpacity={0.55} />
                  <Cell fill="#ef4444" fillOpacity={0.55} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Costos del mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border mb-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">Cargando...</TableCell></TableRow>
                ) : gastos.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">Sin costos cargados</TableCell></TableRow>
                ) : (
                  gastos.map((g) => (
                    <FilaGasto key={g.id} gasto={g} onSaved={actualizar} onDeleted={actualizar} />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Concepto (ej: Cancha)"
              value={nuevoConcepto}
              onChange={(e) => setNuevoConcepto(e.target.value)}
              className="flex-1"
            />
            <Input
              type="number"
              min="0"
              placeholder="Monto"
              value={nuevoMonto}
              onChange={(e) => setNuevoMonto(e.target.value)}
              className="w-32"
            />
            <Button onClick={agregar} disabled={!nuevoConcepto || !nuevoMonto || !torneoId}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <div className="md:hidden">
      <ResumenMobile
        torneos={torneos}
        torneoId={torneoId}
        torneoActual={torneoActual}
        seleccionarTorneo={seleccionarTorneo}
        gastos={gastos}
        horarios={horarios}
        inscripciones={inscripciones}
        loading={loading}
        onActualizar={actualizar}
        onTorneoCreado={onTorneoCreado}
      />
    </div>
    </>
  );
}
