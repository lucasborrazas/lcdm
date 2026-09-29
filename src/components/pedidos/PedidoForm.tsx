"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  calcularPrecioUnitario, calcularPrecioConDescuento, calcularCostoTotal,
  calcularPrecioTotal, calcularGanancia, calcularSaldoRestante, formatearMoneda,
} from "@/lib/calculations";
import type { ProductoConStock } from "@/lib/types";

const schema = z.object({
  fecha: z.string().min(1, "Requerido"),
  cliente: z.string().min(1, "Requerido"),
  productoId: z.string().min(1, "Seleccione un producto"),
  cantidad: z.string().min(1, "Requerido"),
  metodoPago: z.enum(["EFECTIVO", "TRANSFERENCIA"]),
  precioUnitario: z.string(),
  descuentoPct: z.string(),
  sena: z.string(),
  estadoPedido: z.enum(["POR_PEDIR", "ENCARGADO", "ENTREGADO"]),
  estadoPago: z.enum(["PENDIENTE", "SENA", "PAGO"]),
});

type FormValues = z.infer<typeof schema>;

export function PedidoForm({ onSuccess }: { onSuccess: () => void }) {
  const [productos, setProductos] = useState<ProductoConStock[]>([]);
  const [selNombre, setSelNombre] = useState("");
  const [selGenero, setSelGenero] = useState("");

  useEffect(() => {
    fetch("/api/productos").then((r) => r.json()).then(setProductos);
  }, []);

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fecha: today,
      cliente: "",
      productoId: "",
      cantidad: "1",
      metodoPago: "TRANSFERENCIA",
      precioUnitario: "0",
      descuentoPct: "0",
      sena: "0",
      estadoPedido: "POR_PEDIR",
      estadoPago: "PENDIENTE",
    },
  });

  const productoId = form.watch("productoId");
  const metodoPago = form.watch("metodoPago");
  const cantidad = parseInt(form.watch("cantidad") || "1") || 1;
  const precioUnitario = parseInt(form.watch("precioUnitario") || "0") || 0;
  const sena = parseInt(form.watch("sena") || "0") || 0;

  const productosDisponibles = productos.filter((p) => !p.archivado && p.stockActual > 0);
  const nombresDisponibles = Array.from(new Set(productosDisponibles.map((p) => p.nombre))).sort();
  const generosDisponibles = Array.from(
    new Set(productosDisponibles.filter((p) => p.nombre === selNombre).map((p) => p.genero))
  ).sort();
  const tallesDisponibles = productosDisponibles
    .filter((p) => p.nombre === selNombre && p.genero === selGenero)
    .sort((a, b) => a.talle.localeCompare(b.talle));

  const productoSel = productos.find((p) => p.id === productoId);
  const precioBase = productoSel
    ? calcularPrecioUnitario(productoSel.precioVenta, metodoPago as any)
    : 0;
  const costoUnitario = productoSel?.costoActual ?? 0;
  const costoTotal = calcularCostoTotal(cantidad, costoUnitario);
  const precioTotal = calcularPrecioTotal(cantidad, precioUnitario);
  const ganancia = calcularGanancia(precioTotal, costoTotal);
  const saldoRestante = calcularSaldoRestante(precioTotal, sena);

  useEffect(() => {
    const p = productos.find((x) => x.id === productoId);
    if (p) {
      const base = calcularPrecioUnitario(p.precioVenta, metodoPago as any);
      form.setValue("precioUnitario", base.toString());
      form.setValue("descuentoPct", "0");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productoId, metodoPago, productos]);

  const onSubmit = async (values: FormValues) => {
    const res = await fetch("/api/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fecha: values.fecha,
        cliente: values.cliente,
        productoId: values.productoId,
        cantidad: parseInt(values.cantidad),
        metodoPago: values.metodoPago,
        precioUnitario: parseInt(values.precioUnitario || "0") || 0,
        sena: parseInt(values.sena || "0"),
        estadoPedido: values.estadoPedido,
        estadoPago: values.estadoPago,
      }),
    });
    if (res.ok) {
      form.reset({ fecha: today, cliente: "", productoId: "", cantidad: "1", metodoPago: "TRANSFERENCIA", precioUnitario: "0", descuentoPct: "0", sena: "0", estadoPedido: "POR_PEDIR", estadoPago: "PENDIENTE" });
      setSelNombre("");
      setSelGenero("");
      onSuccess();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nuevo pedido</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fecha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cliente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <FormControl><Input placeholder="Nombre del cliente" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormItem>
                <FormLabel>Producto</FormLabel>
                <Select
                  value={selNombre}
                  onValueChange={(v) => {
                    setSelNombre(v);
                    setSelGenero("");
                    form.setValue("productoId", "");
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Elegir..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {nombresDisponibles.map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>

              <FormItem>
                <FormLabel>Género</FormLabel>
                <Select
                  value={selGenero}
                  onValueChange={(v) => {
                    setSelGenero(v);
                    form.setValue("productoId", "");
                  }}
                  disabled={!selNombre}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Elegir..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {generosDisponibles.map((g) => (
                      <SelectItem key={g} value={g}>{g === "MASCULINO" ? "Masculino" : "Femenino"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>

              <FormField
                control={form.control}
                name="productoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Talle</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selGenero}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Elegir..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tallesDisponibles.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.talle} (stock: {p.stockActual})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="cantidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad</FormLabel>
                    <FormControl><Input type="number" min="1" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="metodoPago"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de pago</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                        <SelectItem value="EFECTIVO">Efectivo (−15%)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sena"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seña ($)</FormLabel>
                    <FormControl><Input type="number" min="0" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {productoSel && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="precioUnitario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio unitario ($)</FormLabel>
                      <FormControl><Input type="number" min="0" {...field} /></FormControl>
                      <p className="text-xs text-muted-foreground">
                        Calculado: {formatearMoneda(precioBase)}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="descuentoPct"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descuento (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            const pct = parseFloat(e.target.value) || 0;
                            form.setValue(
                              "precioUnitario",
                              calcularPrecioConDescuento(precioBase, pct).toString()
                            );
                          }}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Aplica sobre el precio calculado
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estadoPedido"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado pedido</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="POR_PEDIR">Por pedir</SelectItem>
                        <SelectItem value="ENCARGADO">Encargado</SelectItem>
                        <SelectItem value="ENTREGADO">Entregado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estadoPago"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado pago</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                        <SelectItem value="SENA">Seña</SelectItem>
                        <SelectItem value="PAGO">Pagado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {productoSel && (
              <>
                <Separator />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Costo unitario</p>
                    <p className="font-medium">{formatearMoneda(costoUnitario)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Costo total</p>
                    <p className="font-medium">{formatearMoneda(costoTotal)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Precio total</p>
                    <p className="font-semibold text-base">{formatearMoneda(precioTotal)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Ganancia</p>
                    <p className={`font-medium ${ganancia >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {formatearMoneda(ganancia)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Saldo restante</p>
                    <p className={`font-medium ${saldoRestante > 0 ? "text-amber-600" : "text-green-600"}`}>
                      {formatearMoneda(saldoRestante)}
                    </p>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Guardando..." : "Registrar pedido"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
