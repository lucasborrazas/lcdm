"use client";

import { useEffect, useState } from "react";
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
import { Trash2 } from "lucide-react";
import {
  calcularPrecioUnitario, calcularPrecioConDescuento, calcularCostoTotal,
  calcularPrecioTotal, calcularGanancia, calcularSaldoRestante, formatearMoneda, compararTalles,
} from "@/lib/calculations";
import type { PedidoConProducto, ProductoConStock } from "@/lib/types";
import { useModoCliente } from "@/components/layout/ModoClienteProvider";
import { useCierreProtegido, ProtegerCierre } from "@/components/shared/CierreProtegido";

const schema = z.object({
  nombre: z.string(),
  genero: z.string(),
  productoId: z.string().min(1, "Elegí el talle"),
  cliente: z.string().min(1),
  metodoPago: z.enum(["EFECTIVO", "TRANSFERENCIA"]),
  cantidad: z.string().min(1),
  precioUnitario: z.string(),
  descuentoPct: z.string(),
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
  const { modoCliente } = useModoCliente();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: "",
      genero: "",
      productoId: "",
      cliente: "",
      metodoPago: "TRANSFERENCIA",
      cantidad: "1",
      precioUnitario: "0",
      descuentoPct: "0",
      sena: "0",
      estadoPedido: "POR_PEDIR",
      estadoPago: "PENDIENTE",
    },
  });
  const proteccion = useCierreProtegido({ open, onOpenChange, dirty: form.formState.isDirty });

  useEffect(() => {
    if (pedido) {
      form.reset({
        nombre: pedido.producto.nombre,
        genero: pedido.producto.genero,
        productoId: pedido.productoId,
        cliente: pedido.cliente,
        metodoPago: pedido.metodoPago,
        cantidad: pedido.cantidad.toString(),
        precioUnitario: pedido.precioUnitario.toString(),
        descuentoPct: "0",
        sena: pedido.sena.toString(),
        estadoPedido: pedido.estadoPedido,
        estadoPago: pedido.estadoPago,
      });
    }
  }, [pedido, open]);

  // Productos para cambiar producto o talle: los activos, mas el actual aunque este archivado.
  const [productos, setProductos] = useState<ProductoConStock[]>([]);
  useEffect(() => {
    if (open) fetch("/api/productos").then((r) => r.json()).then(setProductos);
  }, [open]);

  const metodoPago = form.watch("metodoPago");
  const selNombre = form.watch("nombre");
  const selGenero = form.watch("genero");
  const productoId = form.watch("productoId");
  const elegibles = productos.filter((p) => !p.archivado || p.id === pedido?.productoId);
  const nombres = Array.from(new Set(elegibles.map((p) => p.nombre))).sort();
  const generos = Array.from(new Set(elegibles.filter((p) => p.nombre === selNombre).map((p) => p.genero))).sort();
  const talles = elegibles
    .filter((p) => p.nombre === selNombre && p.genero === selGenero)
    .sort((a, b) => compararTalles(a.talle, b.talle));
  const productoSel = productos.find((p) => p.id === productoId) ?? (productoId === pedido?.productoId ? pedido?.producto : undefined);
  const cambioProducto = !!pedido && productoId !== "" && productoId !== pedido.productoId;

  const elegirTalle = (id: string) => {
    form.setValue("productoId", id, { shouldDirty: true, shouldValidate: true });
    const p = productos.find((x) => x.id === id);
    // Producto nuevo: el precio vuelve al de lista para ese producto.
    if (p && id !== pedido?.productoId) {
      form.setValue("precioUnitario", calcularPrecioUnitario(p.precioVenta, metodoPago).toString(), { shouldDirty: true });
      form.setValue("descuentoPct", "0");
    }
  };
  const cantidad = parseInt(form.watch("cantidad") || "1") || 1;
  const precioUnitario = parseInt(form.watch("precioUnitario") || "0") || 0;
  const sena = parseInt(form.watch("sena") || "0") || 0;

  const precioBase = productoSel ? calcularPrecioUnitario(productoSel.precioVenta, metodoPago) : 0;
  const costoUnitario = productoSel?.costoActual ?? 0;
  const costoTotal = calcularCostoTotal(cantidad, costoUnitario);
  const precioTotal = calcularPrecioTotal(cantidad, precioUnitario);
  const ganancia = calcularGanancia(precioTotal, costoTotal);
  const saldoRestante = calcularSaldoRestante(precioTotal, sena);

  const enGrupo = !!pedido?.pedidoGrupoId;

  const onSubmit = async (values: FormValues) => {
    if (!pedido) return;
    const res = await fetch(`/api/pedidos/${pedido.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productoId: values.productoId,
        cliente: values.cliente,
        metodoPago: values.metodoPago,
        cantidad: parseInt(values.cantidad),
        precioUnitario: parseInt(values.precioUnitario || "0") || 0,
        estadoPedido: values.estadoPedido,
        ...(enGrupo ? {} : { sena: parseInt(values.sena || "0"), estadoPago: values.estadoPago }),
      }),
    });
    if (res.ok) onSuccess();
  };

  const onDelete = async () => {
    if (!pedido) return;
    if (!confirm(`¿Eliminar el pedido de ${pedido.cliente}? Esta acción no se puede deshacer.`)) return;
    const res = await fetch(`/api/pedidos/${pedido.id}`, { method: "DELETE" });
    if (res.ok) onSuccess();
  };

  if (!pedido) return null;

  return (
    <Dialog open={open} onOpenChange={proteccion.onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar pedido</DialogTitle>
        </DialogHeader>
        {enGrupo && (
          <p className="text-xs text-muted-foreground bg-muted px-3 py-2 rounded-md -mt-2">
            Este producto es parte de un pedido con varios productos. La seña y el estado de
            pago se manejan desde la fila resumen del pedido en la tabla.
          </p>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Producto</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        form.setValue("genero", "");
                        form.setValue("productoId", "");
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Elegir..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {nombres.map((n) => (
                          <SelectItem key={n} value={n}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="genero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Género</FormLabel>
                    <Select
                      value={field.value}
                      disabled={!selNombre}
                      onValueChange={(v) => {
                        field.onChange(v);
                        form.setValue("productoId", "");
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Elegir..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {generos.map((g) => (
                          <SelectItem key={g} value={g}>{g === "MASCULINO" ? "Masculino" : "Femenino"}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="productoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Talle</FormLabel>
                    <Select value={field.value} disabled={!selGenero} onValueChange={(v) => v && elegirTalle(v)}>
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Elegir..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {talles.map((p) => (
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
            {cambioProducto && (
              <p className="-mt-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                Antes: {pedido.productoNombre} — Talle {pedido.talle}. El precio se recalculó para el producto nuevo
                {pedido.stockDescontado && " y el stock descontado pasa a este producto"}.
              </p>
            )}

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

            {!enGrupo && (
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
            )}

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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className={enGrupo ? "grid grid-cols-1 gap-4" : "grid grid-cols-2 gap-4"}>
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
              {!enGrupo && (
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
              )}
            </div>

            <Separator />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-semibold">{formatearMoneda(precioTotal)}</p>
              </div>
              {!modoCliente && (
                <div>
                  <p className="text-xs text-muted-foreground">Ganancia</p>
                  <p className={ganancia >= 0 ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                    {formatearMoneda(ganancia)}
                  </p>
                </div>
              )}
              {!enGrupo && (
                <div>
                  <p className="text-xs text-muted-foreground">Saldo restante</p>
                  <p className={saldoRestante > 0 ? "text-amber-600 font-medium" : "text-green-600 font-medium"}>
                    {formatearMoneda(saldoRestante)}
                  </p>
                </div>
              )}
            </div>

            {pedido.stockDescontado && (
              <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-md">
                ✓ Stock ya descontado (pedido encargado o entregado)
              </p>
            )}

            <div className="flex justify-between gap-2">
              <Button type="button" variant="ghost" className="text-red-500 hover:text-red-600" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Eliminar
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => proteccion.onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
        <ProtegerCierre proteccion={proteccion} />
      </DialogContent>
    </Dialog>
  );
}
