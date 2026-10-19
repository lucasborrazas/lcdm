"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, FlaskConical, Minus, Pencil, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import { Bar, BarChart, Cell, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatearMoneda } from "@/lib/calculations";
import { colorHorario } from "@/lib/torneo";
import { cn } from "@/lib/utils";
import {
  esSimulacionVacia,
  simularTorneo,
  type CostoSimulado,
  type HorarioSimulado,
  type ResultadoSimulacion,
  type Simulacion,
} from "@/lib/simulacionTorneo";
import type { GastoTorneo, HorarioConCupo, InscripcionConHorario, TorneoConResumen } from "@/lib/types";
import { nuevoIdSimulado, type EstadoGuardado, type useSimulacion } from "./useSimulacion";

export type SimulacionHook = ReturnType<typeof useSimulacion>;

// Lo que comparten la vista de escritorio y la de mobile.
export function useResultadoSimulacion(
  torneo: TorneoConResumen | null,
  horarios: HorarioConCupo[],
  inscripciones: InscripcionConHorario[],
  gastos: GastoTorneo[],
  sim: Simulacion
): ResultadoSimulacion {
  return useMemo(
    () =>
      simularTorneo(
        {
          precios: {
            precioEfectivo: torneo?.precioEfectivo ?? 0,
            precioTransferencia: torneo?.precioTransferencia ?? 0,
          },
          horarios: horarios
            .filter((h) => h.activo || h.inscriptos > 0)
            .map((h) => ({ id: h.id, hora: h.hora, nombre: h.grupoEdad.nombre, orden: h.orden, cupoMaximo: h.cupoMaximo })),
          inscripciones,
          gastos,
        },
        sim
      ),
    [torneo, horarios, inscripciones, gastos, sim]
  );
}

// invertido: para costos, subir es malo (rojo).
export function Diferencia({ valor, invertido, className }: { valor: number; invertido?: boolean; className?: string }) {
  if (valor === 0) return <span className={cn("text-muted-foreground", className)}>igual que lo real</span>;
  const bueno = invertido ? valor < 0 : valor > 0;
  return (
    <span className={cn(bueno ? "text-green-600" : "text-destructive", className)}>
      {valor > 0 ? "+" : "−"}
      {formatearMoneda(Math.abs(valor))} vs. real
    </span>
  );
}

export function TextoGuardado({ estado }: { estado: EstadoGuardado }) {
  const texto = { cargando: "Cargando…", guardando: "Guardando…", guardado: "Guardado", error: "No se pudo guardar" }[estado];
  return <span className={cn("text-xs", estado === "error" ? "text-destructive" : "text-muted-foreground")}>{texto}</span>;
}

// Cuantos alumnos quedan en efectivo y en transferencia segun el %.
export function ConteoMedios({ medios, className }: { medios: ResultadoSimulacion["medios"]; className?: string }) {
  const filas = [
    { label: "Efectivo", pagaron: medios.pagaronEfectivo, esperados: medios.esperadosEfectivo },
    { label: "Transferencia", pagaron: medios.pagaronTransferencia, esperados: medios.esperadosTransferencia },
  ];
  return (
    <div className={cn("space-y-1 text-sm", className)}>
      {filas.map((f) => (
        <div key={f.label} className="flex flex-wrap items-baseline gap-x-1.5">
          <span className="w-28 shrink-0 text-muted-foreground">{f.label}</span>
          <span className="font-semibold">{f.pagaron + f.esperados} alumnos</span>
          <span className="text-xs text-muted-foreground">
            ({f.pagaron} ya pagaron + {f.esperados} esperados)
          </span>
        </div>
      ))}
      {medios.pendientesSinContar > 0 && (
        <div className="text-xs text-muted-foreground">
          {medios.pendientesSinContar} pendiente{medios.pendientesSinContar === 1 ? "" : "s"} sin contar: activá
          &quot;Todos los anotados pagan&quot; para sumarlos.
        </div>
      )}
    </div>
  );
}

// Cambios sobre la simulacion, iguales en escritorio y mobile.
export function accionesSimulacion(actualizar: SimulacionHook["actualizar"]) {
  return {
    setTodosPagan: (todosPagan: boolean) => actualizar((s) => ({ ...s, todosPagan })),
    setPctEfectivo: (pctEfectivo: number) => actualizar((s) => ({ ...s, pctEfectivo })),
    setExtra: (horarioId: string, n: number) =>
      actualizar((s) => ({ ...s, extras: { ...s.extras, [horarioId]: Math.max(0, n) } })),
    agregarHorario: (h: Omit<HorarioSimulado, "id">) =>
      actualizar((s) => ({ ...s, horarios: [...s.horarios, { ...h, id: nuevoIdSimulado() }] })),
    editarHorario: (id: string, cambio: Partial<HorarioSimulado>) =>
      actualizar((s) => ({ ...s, horarios: s.horarios.map((h) => (h.id === id ? { ...h, ...cambio } : h)) })),
    quitarHorario: (id: string) => actualizar((s) => ({ ...s, horarios: s.horarios.filter((h) => h.id !== id) })),
    agregarCosto: (c: Omit<CostoSimulado, "id">) =>
      actualizar((s) => ({ ...s, costos: [...s.costos, { ...c, id: nuevoIdSimulado() }] })),
    editarCosto: (id: string, cambio: Partial<CostoSimulado>) =>
      actualizar((s) => ({ ...s, costos: s.costos.map((c) => (c.id === id ? { ...c, ...cambio } : c)) })),
    quitarCosto: (id: string) => actualizar((s) => ({ ...s, costos: s.costos.filter((c) => c.id !== id) })),
  };
}

export const aEntero = (v: string) => Math.max(0, parseInt(v) || 0);

const BORDE_SIM = "border-dashed border-amber-500/60";

function Stepper({ valor, onChange, etiqueta }: { valor: number; onChange: (n: number) => void; etiqueta: string }) {
  return (
    <div className="inline-flex items-center gap-1">
      <Button variant="outline" size="icon-sm" onClick={() => onChange(valor - 1)} disabled={valor === 0} aria-label={`Quitar ${etiqueta}`}>
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <Input
        type="number"
        min="0"
        value={valor}
        onChange={(e) => onChange(aEntero(e.target.value))}
        className="h-7 w-14 text-center text-sm"
        aria-label={etiqueta}
      />
      <Button variant="outline" size="icon-sm" onClick={() => onChange(valor + 1)} aria-label={`Sumar ${etiqueta}`}>
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function MetricaSimulada({
  titulo,
  valor,
  diferencia,
  invertido,
  className,
}: {
  titulo: string;
  valor: number;
  diferencia: number;
  invertido?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn(BORDE_SIM, className)}>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{formatearMoneda(Math.abs(valor))}</p>
        <Diferencia valor={diferencia} invertido={invertido} className="text-xs" />
      </CardContent>
    </Card>
  );
}

function FilaCostoSimulado({
  costo,
  onGuardar,
  onQuitar,
}: {
  costo: CostoSimulado;
  onGuardar: (c: Partial<CostoSimulado>) => void;
  onQuitar: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [concepto, setConcepto] = useState(costo.concepto);
  const [monto, setMonto] = useState(costo.monto.toString());

  if (editando) {
    return (
      <TableRow>
        <TableCell colSpan={3}>
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!concepto.trim()) return;
              onGuardar({ concepto: concepto.trim(), monto: aEntero(monto) });
              setEditando(false);
            }}
          >
            <Input value={concepto} onChange={(e) => setConcepto(e.target.value)} className="h-8 flex-1 text-sm" autoFocus />
            <Input type="number" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} className="h-8 w-32 text-right text-sm" />
            <Button type="submit" variant="ghost" size="icon-sm" disabled={!concepto.trim()} title="Guardar">
              <Save className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setEditando(false)} title="Cancelar">
              <X className="h-3.5 w-3.5" />
            </Button>
          </form>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow className="bg-amber-500/5">
      <TableCell className="italic">
        {costo.concepto}
        <Badge variant="outline" className={cn("ml-2 text-[10px] font-normal not-italic", BORDE_SIM)}>Simulado</Badge>
      </TableCell>
      <TableCell className="text-right italic">{formatearMoneda(costo.monto)}</TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            title="Editar"
            onClick={() => {
              setConcepto(costo.concepto);
              setMonto(costo.monto.toString());
              setEditando(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" className="text-red-500 hover:text-red-600" title="Quitar" onClick={onQuitar}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// Resumen de Torneo en modo simulacion (escritorio). Todo lo que se toca aca
// vive en la simulacion guardada; inscripciones y costos reales no cambian.
export function SimulacionResumen({
  torneo,
  horarios,
  inscripciones,
  gastos,
  simulacion,
}: {
  torneo: TorneoConResumen | null;
  horarios: HorarioConCupo[];
  inscripciones: InscripcionConHorario[];
  gastos: GastoTorneo[];
  simulacion: SimulacionHook;
}) {
  const { sim, estado, cargada, actualizar, reiniciar } = simulacion;
  const r = useResultadoSimulacion(torneo, horarios, inscripciones, gastos, sim);
  const acc = accionesSimulacion(actualizar);
  const [nuevoConcepto, setNuevoConcepto] = useState("");
  const [nuevoMonto, setNuevoMonto] = useState("");

  const simulados = new Map(sim.horarios.map((h) => [h.id, h]));
  const ganancia = r.ganancia;

  const datosAlumnos = r.filas.map((f) => ({
    hora: f.hora || "—",
    nombre: f.nombre,
    reales: f.reales,
    extra: f.extra,
    total: f.total,
    color: f.simulado ? "#f59e0b" : colorHorario(f.orden).hex,
  }));
  const datosPlata = [
    { name: "Ingresos", Real: r.ingresoReal, Simulado: r.ingreso },
    { name: "Costos", Real: r.costosReales, Simulado: r.costos },
    { name: "Ganancia", Real: r.gananciaReal, Simulado: r.ganancia },
  ];

  const agregarCosto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoConcepto.trim() || !nuevoMonto) return;
    acc.agregarCosto({ concepto: nuevoConcepto.trim(), monto: aEntero(nuevoMonto) });
    setNuevoConcepto("");
    setNuevoMonto("");
  };

  if (!cargada) return <p className="py-8 text-center text-muted-foreground">Cargando simulación...</p>;

  return (
    <div>
      <div className={cn("mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-amber-500/5 px-4 py-2.5", BORDE_SIM)}>
        <div className="flex items-center gap-2 text-sm">
          <FlaskConical className="h-4 w-4 text-amber-600" />
          <span className="font-semibold">Simulación</span>
          <span className="text-muted-foreground">· No afecta inscripciones ni costos reales</span>
        </div>
        <div className="flex items-center gap-3">
          <TextoGuardado estado={estado} />
          <Button
            variant="outline"
            size="sm"
            disabled={esSimulacionVacia(sim)}
            onClick={() => confirm("¿Borrar toda la simulación y volver a los datos reales?") && reiniciar()}
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Reiniciar simulación
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricaSimulada titulo={ganancia >= 0 ? "Ganancia esperada" : "Pérdida esperada"} valor={ganancia} diferencia={r.ganancia - r.gananciaReal} />
        <MetricaSimulada titulo="Ingresos esperados" valor={r.ingreso} diferencia={r.ingreso - r.ingresoReal} className="bg-green-500/10" />
        <MetricaSimulada titulo="Costos esperados" valor={r.costos} diferencia={r.costos - r.costosReales} invertido className="bg-red-500/10" />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm">Supuestos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-x-10 gap-y-4">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <Checkbox checked={sim.todosPagan} onCheckedChange={(v) => acc.setTodosPagan(!!v)} />
            Todos los anotados pagan
          </label>
          <div className="flex min-w-72 flex-1 items-center gap-3 text-sm">
            <span className="shrink-0 text-muted-foreground">Pagan en efectivo</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={sim.pctEfectivo}
              onChange={(e) => acc.setPctEfectivo(parseInt(e.target.value))}
              className="flex-1 accent-primary"
              aria-label="Porcentaje que paga en efectivo"
            />
            <span className="w-28 shrink-0 font-medium">
              {sim.pctEfectivo}% efectivo
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Precio esperado por persona: <span className="font-semibold text-foreground">{formatearMoneda(r.precioPorPersona)}</span>
          </div>
          <ConteoMedios medios={r.medios} className="basis-full border-t pt-3" />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm">Gente por horario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Horario</TableHead>
                  <TableHead className="text-center">Inscriptos</TableHead>
                  <TableHead className="text-center">Gente extra</TableHead>
                  <TableHead className="text-center">Total / cupo</TableHead>
                  <TableHead className="text-right">Ingreso esperado</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {r.filas.map((f) => {
                  const hs = simulados.get(f.id);
                  return (
                    <TableRow key={f.id} className={cn(f.simulado && "bg-amber-500/5")}>
                      <TableCell>
                        {hs ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={hs.hora}
                              onChange={(e) => acc.editarHorario(hs.id, { hora: e.target.value })}
                              placeholder="12:00"
                              className="h-7 w-20 text-sm"
                              aria-label="Hora del horario simulado"
                            />
                            <Input
                              value={hs.etiqueta}
                              onChange={(e) => acc.editarHorario(hs.id, { etiqueta: e.target.value })}
                              placeholder="Grupo (opcional)"
                              className="h-7 w-40 text-sm"
                              aria-label="Grupo del horario simulado"
                            />
                            <Badge variant="outline" className={cn("text-[10px] font-normal", BORDE_SIM)}>Simulado</Badge>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 font-medium">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colorHorario(f.orden).hex }} />
                            {f.hora}
                            <span className="font-normal text-muted-foreground">· {f.nombre}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {f.simulado ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <>
                            {f.reales}
                            <span className="text-xs text-muted-foreground"> ({f.pagaron} pagaron)</span>
                          </>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Stepper
                          valor={f.extra}
                          etiqueta={`gente en ${f.hora || "el horario simulado"}`}
                          onChange={(n) => (hs ? acc.editarHorario(hs.id, { personas: Math.max(0, n) }) : acc.setExtra(f.id, n))}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span className={cn("font-semibold", f.excedeCupo && "text-destructive")}>{f.total}</span>
                          {hs ? (
                            <Input
                              type="number"
                              min="1"
                              value={hs.cupo ?? ""}
                              onChange={(e) => acc.editarHorario(hs.id, { cupo: e.target.value ? Math.max(1, aEntero(e.target.value)) : null })}
                              placeholder="Cupo"
                              className="h-7 w-16 text-center text-sm"
                              aria-label="Cupo del horario simulado"
                            />
                          ) : (
                            f.cupo != null && <span className="text-muted-foreground">/ {f.cupo}</span>
                          )}
                          {f.excedeCupo && (
                            <span title="Supera el cupo">
                              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatearMoneda(f.ingreso)}</TableCell>
                      <TableCell>
                        {hs && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-red-500 hover:text-red-600"
                            title="Quitar horario simulado"
                            onClick={() => acc.quitarHorario(hs.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-muted/40 font-bold hover:bg-muted/40">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-center">{r.personasReales}</TableCell>
                  <TableCell className="text-center">+{r.personasSimuladas - r.personasReales}</TableCell>
                  <TableCell className="text-center">{r.personasSimuladas}</TableCell>
                  <TableCell className="text-right">{formatearMoneda(r.ingreso)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <Button variant="outline" onClick={() => acc.agregarHorario({ hora: "", etiqueta: "", cupo: null, personas: 0 })}>
            <Plus className="mr-1 h-4 w-4" />
            Agregar horario simulado
          </Button>
        </CardContent>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className={BORDE_SIM}>
          <CardHeader>
            <CardTitle className="text-sm">Alumnos por horario (simulado)</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosAlumnos}>
                <XAxis dataKey="hora" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} width={30} allowDecimals={false} />
                <Tooltip
                  formatter={(v, name) => [v, name === "reales" ? "Inscriptos" : "Extra"]}
                  labelFormatter={(label, payload) => {
                    const p = payload?.[0]?.payload as { hora: string; nombre: string } | undefined;
                    return p ? `${p.hora}${p.nombre ? ` — ${p.nombre}` : ""}` : label;
                  }}
                />
                <Bar dataKey="reales" stackId="a">
                  {datosAlumnos.map((d, i) => (
                    <Cell key={i} fill={d.color} fillOpacity={0.55} />
                  ))}
                </Bar>
                <Bar dataKey="extra" stackId="a" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="total" position="top" style={{ fontSize: 12, fontWeight: 600, fill: "currentColor" }} />
                  {datosAlumnos.map((d, i) => (
                    <Cell key={i} fill={d.color} fillOpacity={0.2} stroke={d.color} strokeDasharray="4 3" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className={BORDE_SIM}>
          <CardHeader>
            <CardTitle className="text-sm">Real vs. simulado</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosPlata}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} width={70} tickFormatter={(v) => formatearMoneda(v)} />
                <Tooltip formatter={(v, name) => [typeof v === "number" ? formatearMoneda(v) : v, name]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Real" fill="#94a3b8" fillOpacity={0.6} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Simulado" fill="#f59e0b" fillOpacity={0.6} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Costos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gastos.map((g) => (
                  <TableRow key={g.id} className="text-muted-foreground">
                    <TableCell>{g.concepto}</TableCell>
                    <TableCell className="text-right">{formatearMoneda(g.monto)}</TableCell>
                    <TableCell className="text-right text-xs">real</TableCell>
                  </TableRow>
                ))}
                {sim.costos.map((c) => (
                  <FilaCostoSimulado
                    key={c.id}
                    costo={c}
                    onGuardar={(cambio) => acc.editarCosto(c.id, cambio)}
                    onQuitar={() => acc.quitarCosto(c.id)}
                  />
                ))}
                {gastos.length === 0 && sim.costos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">Sin costos</TableCell>
                  </TableRow>
                )}
                <TableRow className="bg-muted/40 font-bold hover:bg-muted/40">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{formatearMoneda(r.costos)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <form className="flex gap-2" onSubmit={agregarCosto}>
            <Input
              placeholder="Costo simulado (ej: Árbitro extra)"
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
            <Button type="submit" disabled={!nuevoConcepto.trim() || !nuevoMonto}>
              <Plus className="mr-1 h-4 w-4" />
              Agregar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
