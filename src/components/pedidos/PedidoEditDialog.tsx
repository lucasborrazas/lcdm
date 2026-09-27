"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  calcularPrecioUnitario, calcularCostoTotal, calcularPrecioTotal,
  calcularGanancia, calcularSaldoRestante, formatearMoneda,
} from "@/lib/calculations";
import type { PedidoConProducto } from "@/lib/types";

const schema = z.object({
  cliente: z.string().min(1),
  metodoPago: z.enum(["EFECTIVO", "TRANSFERENCIA"]),
  cantidad: z.string().min(1),
  sena: z.string(),
  estadoPedido: z.enum(["POR_PEDIR", "ENCARGADO", "ENTREGADO"]),
  estadoPago: z.enum(["PENDIENTE", "SENA", "PAGO"]),
});

type FormValues = z.infer<typeof schema>;

export function PedidoEditDialog({
  open,
  onOpenChange,
  pedido,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pedido: PedidoConProducto | null;
  onSuccess: () => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      cliente: "",
      metodoPago: "TRANSFERENCIA",
      cantidad: "1",
      sena: "0",
      estadoPedido: "POR_PEDIR",
      estadoPago: "PENDIENTE",
    },
  });

  useEffect(() => {
    if (pedido) {
      form.reset({
        cliente: pedido.cliente,
        metodoPago: pedido.metodoPago,
        cantidad: pedido.cantidad.toString(),
        sena: pedido.sena.toString(),
        estadoPedido: pedido.estadoPedido,
        estadoPago: pedido.estadoPago,
      });
    }
  }, [pedido, open]);

  const metodoPago = form.watch("metodoPago");
  const cantidad = parseInt(form.watch("cantidad") || "1") || 1;
  const sena = parseInt(form.watch("sena") || "0") || 0;

  const precioUnitario = pedido
    ? calcularPrecioUnitario(pedido.producto.precioVenta, metodoPago as any)
    : 0;
  const costoUnitario = pedido?.producto.costoActual ?? 0;
  const costoTotal = calcularCostoTotal(cantidad, costoUnitario);
  const precioTotal = calcularPrecioTotal(cantidad, precioUnitario);
  const ganancia = calcularGanancia(precioTotal, costoTotal);
  const saldoRestante = calcularSaldoRestante(precioTotal, sena);

  const onSubmit = async (values: FormValues) => {
    if (!pedido) return;
    const res = await fetch(`/api/pedidos/${pedido.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cliente: values.cliente,
        metodoPago: values.metodoPago,
        cantidad: parseInt(values.cantidad),
        sena: parseInt(values.sena || "0"),
        estadoPedido: values.estadoPedido,
        estadoPago: values.estadoPago,
      }),
    });
    if (res.ok) onSuccess();
  };

  if (!pedido) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar pedido</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          {pedido.productoNombre} — Talle {pedido.talle}
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cliente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="metodoPago"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de pago</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                name="cantidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad</FormLabel>
                    <FormControl><Input type="number" min="1" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estadoPedido"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado pedido</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                        <SelectTrigger><SelectValue /></SelectTrigger>
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

            <Separator />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Precio unit.</p>
                <p className="font-medium">{formatearMoneda(precioUnitario)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-semibold">{formatearMoneda(precioTotal)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ganancia</p>
                <p className={ganancia >= 0 ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                  {formatearMoneda(ganancia)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo restante</p>
                <p className={saldoRestante > 0 ? "text-amber-600 font-medium" : "text-green-600 font-medium"}>
                  {formatearMoneda(saldoRestante)}
                </p>
              </div>
            </div>

            {pedido.stockDescontado && (
              <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-md">
                ✓ Stock ya descontado
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
