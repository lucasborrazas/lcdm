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
  calcularPrecioUnitario, calcularCostoTotal, calcularPrecioTotal,
  calcularGanancia, calcularSaldoRestante, formatearMoneda,
} from "@/lib/calculations";
import type { ProductoConStock } from "@/lib/types";

const schema = z.object({
  fecha: z.string().min(1, "Requerido"),
  cliente: z.string().min(1, "Requerido"),
  productoId: z.string().min(1, "Seleccione un producto"),
  cantidad: z.string().min(1, "Requerido"),
  metodoPago: z.enum(["EFECTIVO", "TRANSFERENCIA"]),
  sena: z.string(),
  estadoPedido: z.enum(["POR_PEDIR", "ENCARGADO", "ENTREGADO"]),
  estadoPago: z.enum(["PENDIENTE", "SENA", "PAGO"]),
});

type FormValues = z.infer<typeof schema>;

export function PedidoForm({ onSuccess }: { onSuccess: () => void }) {
  const [productos, setProductos] = useState<ProductoConStock[]>([]);

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
      sena: "0",
      estadoPedido: "POR_PEDIR",
      estadoPago: "PENDIENTE",
    },
  });

  const productoId = form.watch("productoId");
  const metodoPago = form.watch("metodoPago");
  const cantidad = parseInt(form.watch("cantidad") || "1") || 1;
  const sena = parseInt(form.watch("sena") || "0") || 0;

  const productoSel = productos.find((p) => p.id === productoId);
  const precioUnitario = productoSel
    ? calcularPrecioUnitario(productoSel.precioVenta, metodoPago as any)
    : 0;
  const costoUnitario = productoSel?.costoActual ?? 0;
  const costoTotal = calcularCostoTotal(cantidad, costoUnitario);
  const precioTotal = calcularPrecioTotal(cantidad, precioUnitario);
  const ganancia = calcularGanancia(precioTotal, costoTotal);
  const saldoRestante = calcularSaldoRestante(precioTotal, sena);

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
        sena: parseInt(values.sena || "0"),
        estadoPedido: values.estadoPedido,
        estadoPago: values.estadoPago,
      }),
    });
    if (res.ok) {
      form.reset({ fecha: today, cliente: "", productoId: "", cantidad: "1", metodoPago: "TRANSFERENCIA", sena: "0", estadoPedido: "POR_PEDIR", estadoPago: "PENDIENTE" });
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

            <FormField
              control={form.control}
              name="productoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Producto</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar producto..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {productos.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.temporada === "VERANO" ? "V" : "I"} {p.genero === "MASCULINO" ? "M" : "F"} — {p.nombre} T.{p.talle} (stock: {p.stockActual})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    <p className="text-muted-foreground text-xs">Precio unitario</p>
                    <p className="font-medium">
                      {formatearMoneda(precioUnitario)}
                      {metodoPago === "EFECTIVO" && (
                        <span className="text-xs text-green-600 ml-1">(−15%)</span>
                      )}
                    </p>
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
