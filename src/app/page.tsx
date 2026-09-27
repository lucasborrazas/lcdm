"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { MonedaCell } from "@/components/shared/MonedaCell";
import { BadgeEstadoPago } from "@/components/shared/BadgeEstado";
import { periodoActual, fechaAPeriodo, formatearMoneda } from "@/lib/calculations";

const COLORES = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

function generarPeriodos(): string[] {
  const periodos: string[] = [];
  const ahora = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    periodos.push(fechaAPeriodo(d));
  }
  return periodos;
}

type DashboardData = {
  periodo: string;
  metricas: {
    totalVendido: number;
    cantidadPedidos: number;
    unidadesVendidas: number;
    costoTotal: number;
    gananciaTotal: number;
    margenPct: number;
    totalSenas: number;
    saldoPendiente: number;
  };
  ranking: Array<{ productoNombre: string; talle: string; unidadesVendidas: number; ventas: number; ganancia: number }>;
  cobranza: Array<{ estadoPago: string; cantidadPedidos: number; total: number; saldo: number }>;
  chartUnidades: Array<{ name: string; value: number }>;
  chartGanancia: Array<{ name: string; value: number }>;
};

function MetricaCard({ titulo, valor, subvalor, color }: { titulo: string; valor: string; subvalor?: string; color?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold ${color ?? ""}`}>{valor}</p>
        {subvalor && <p className="text-xs text-muted-foreground mt-1">{subvalor}</p>}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [periodo, setPeriodo] = useState(periodoActual());
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const periodos = generarPeriodos();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard?periodo=${encodeURIComponent(periodo)}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [periodo]);

  const m = data?.metricas;

  return (
    <>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Resumen financiero del período</p>
        </div>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodos.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Cargando...</p>
      ) : !m ? null : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricaCard titulo="Total vendido" valor={formatearMoneda(m.totalVendido)} />
            <MetricaCard titulo="Pedidos" valor={m.cantidadPedidos.toString()} subvalor={`${m.unidadesVendidas} unidades`} />
            <MetricaCard titulo="Ganancia" valor={formatearMoneda(m.gananciaTotal)} subvalor={`Margen: ${m.margenPct}%`} color="text-green-600" />
            <MetricaCard titulo="Costo total" valor={formatearMoneda(m.costoTotal)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricaCard titulo="Total señas" valor={formatearMoneda(m.totalSenas)} />
            <MetricaCard titulo="Saldo pendiente" valor={formatearMoneda(m.saldoPendiente)} color={m.saldoPendiente > 0 ? "text-amber-600" : undefined} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ranking de productos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Unid.</TableHead>
                        <TableHead className="text-right">Ventas</TableHead>
                        <TableHead className="text-right">Ganancia</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data!.ranking.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-muted-foreground text-sm">
                            Sin datos para este período
                          </TableCell>
                        </TableRow>
                      ) : (
                        data!.ranking.map((r, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm">{r.productoNombre} T.{r.talle}</TableCell>
                            <TableCell className="text-right text-sm">{r.unidadesVendidas}</TableCell>
                            <TableCell className="text-right text-sm"><MonedaCell valor={r.ventas} /></TableCell>
                            <TableCell className="text-right text-sm text-green-600"><MonedaCell valor={r.ganancia} /></TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Cobranza por estado de pago</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Pedidos</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data!.cobranza.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-muted-foreground text-sm">Sin datos</TableCell>
                        </TableRow>
                      ) : (
                        data!.cobranza.map((c, i) => (
                          <TableRow key={i}>
                            <TableCell><BadgeEstadoPago estado={c.estadoPago} /></TableCell>
                            <TableCell className="text-right text-sm">{c.cantidadPedidos}</TableCell>
                            <TableCell className="text-right text-sm"><MonedaCell valor={c.total} /></TableCell>
                            <TableCell className="text-right text-sm"><MonedaCell valor={c.saldo} /></TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {data!.chartUnidades.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Unidades vendidas por producto</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data!.chartUnidades} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                        {data!.chartUnidades.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [v, "Unidades"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Ganancia por producto</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data!.chartGanancia} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                        {data!.chartGanancia.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [typeof v === "number" ? formatearMoneda(v) : v, "Ganancia"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </>
  );
}
