"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, useWatch, type UseFormReturn, type Control } from "react-hook-form";
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
import { Plus, Trash2 } from "lucide-react";
import {
  calcularPrecioUnitario, calcularPrecioConDescuento, calcularCostoTotal,
  calcularPrecioTotal, calcularGanancia, formatearMoneda, compararTalles,
} from "@/lib/calculations";
import type { ProductoConStock } from "@/lib/types";
import { useModoCliente } from "@/components/layout/ModoClienteProvider";

const lineaSchema = z.object({
  productoId: z.string().min(1, "Seleccione un producto"),
  cantidad: z.string().min(1, "Requerido"),
  precioUnitario: z.string(),
  descuentoPct: z.string(),
});

const schema = z.object({
  fecha: z.string().min(1, "Requerido"),
  cliente: z.string().min(1, "Requerido"),
  metodoPago: z.enum(["EFECTIVO", "TRANSFERENCIA"]),
  sena: z.string(),
  estadoPedido: z.enum(["POR_PEDIR", "ENCARGADO", "ENTREGADO"]),
  estadoPago: z.enum(["PENDIENTE", "SENA", "PAGO"]),
  lineas: z.array(lineaSchema).min(1),
});

type FormValues = z.infer<typeof schema>;

const LINEA_VACIA = { productoId: "", cantidad: "1", precioUnitario: "0", descuentoPct: "0" };

function LineaPedido({
  form,
  index,
  productos,
  onRemove,
  removable,
}: {
  form: UseFormReturn<FormValues>;
  index: number;
  productos: ProductoConStock[];
  onRemove: () => void;
  removable: boolean;
}) {
  const { modoCliente } = useModoCliente();
  const [selNombre, setSelNombre] = useState("");
  const [selGenero, setSelGenero] = useState("");

  const productoId = useWatch({ control: form.control, name: `lineas.${index}.productoId` });
  const metodoPago = useWatch({ control: form.control, name: "metodoPago" });
  const cantidad = parseInt(useWatch({ control: form.control, name: `lineas.${index}.cantidad` }) || "1") || 1;
  const precioUnitario = parseInt(useWatch({ control: form.control, name: `lineas.${index}.precioUnitario` }) || "0") || 0;

  const productosDisponibles = productos.filter((p) => !p.archivado);
  const nombresDisponibles = Array.from(new Set(productosDisponibles.map((p) => p.nombre))).sort();
  const generosDisponibles = Array.from(
    new Set(productosDisponibles.filter((p) => p.nombre === selNombre).map((p) => p.genero))
  ).sort();
  const tallesDisponibles = productosDisponibles
    .filter((p) => p.nombre === selNombre && p.genero === selGenero)
    .sort((a, b) => compararTalles(a.talle, b.talle));

  const productoSel = productos.find((p) => p.id === productoId);
  const precioBase = productoSel
    ? calcularPrecioUnitario(productoSel.precioVenta, metodoPago as any)
    : 0;
  const costoUnitario = productoSel?.costoActual ?? 0;
  const costoTotal = calcularCostoTotal(cantidad, costoUnitario);
  const precioTotal = calcularPrecioTotal(cantidad, precioUnitario);
  const ganancia = calcularGanancia(precioTotal, costoTotal);

  useEffect(() => {
    const p = productos.find((x) => x.id === productoId);
    if (p) {
      const base = calcularPrecioUnitario(p.precioVenta, metodoPago as any);
      form.setValue(`lineas.${index}.precioUnitario`, base.toString());
      form.setValue(`lineas.${index}.descuentoPct`, "0");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productoId, metodoPago, productos]);

  return (
    <div className="space-y-3 border rounded-md p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          <FormItem>
            <FormLabel className="text-xs">Producto</FormLabel>
            <Select
              value={selNombre}
              onValueChange={(v) => {
                setSelNombre(v);
                setSelGenero("");
                form.setValue(`lineas.${index}.productoId`, "");
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
            <FormLabel className="text-xs">Género</FormLabel>
            <Select
              value={selGenero}
              onValueChange={(v) => {
                setSelGenero(v);
                form.setValue(`lineas.${index}.productoId`, "");
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
            name={`lineas.${index}.productoId`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Talle</FormLabel>
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
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mt-6 shrink-0"
          disabled={!removable}
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <FormField
          control={form.control}
          name={`lineas.${index}.cantidad`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Cantidad</FormLabel>
              <FormControl><Input type="number" min="1" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`lineas.${index}.precioUnitario`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Precio unit. ($)</FormLabel>
              <FormControl><Input type="number" min="0" {...field} /></FormControl>
              {productoSel && (
                <p className="text-[11px] text-muted-foreground">Calc: {formatearMoneda(precioBase)}</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`lineas.${index}.descuentoPct`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Descuento (%)</FormLabel>
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
                      `lineas.${index}.precioUnitario`,
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

      {productoSel && (
        <p className="text-xs text-muted-foreground">
          Total línea: <strong className="text-foreground">{formatearMoneda(precioTotal)}</strong>
          {!modoCliente && (
            <>
              {" · "}Ganancia: <span className={ganancia >= 0 ? "text-green-600" : "text-red-500"}>{formatearMoneda(ganancia)}</span>
            </>
          )}
        </p>
      )}
    </div>
  );
}

function ResumenPedido({ control }: { control: Control<FormValues> }) {
  const lineas = useWatch({ control, name: "lineas" });
  const sena = parseInt(useWatch({ control, name: "sena" }) || "0") || 0;

  const precioTotal = lineas.reduce((s, l) => {
    const cantidad = parseInt(l.cantidad || "0") || 0;
    const precioUnitario = parseInt(l.precioUnitario || "0") || 0;
    return s + cantidad * precioUnitario;
  }, 0);
  const saldoRestante = precioTotal - sena;

  return (
    <>
      <Separator />
      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground">
          Total pedido: <strong className="text-foreground">{formatearMoneda(precioTotal)}</strong>
          {sena > 0 && <> · Seña <strong className="text-foreground">{formatearMoneda(sena)}</strong></>}
          {" · "}Saldo: <span className={saldoRestante > 0 ? "text-amber-600 font-medium" : "text-green-600 font-medium"}>{formatearMoneda(saldoRestante)}</span>
        </div>
      </div>
    </>
  );
}

export function PedidoCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [productos, setProductos] = useState<ProductoConStock[]>([]);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (open) {
      fetch("/api/productos").then((r) => r.json()).then(setProductos);
    }
  }, [open]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fecha: today,
      cliente: "",
      metodoPago: "TRANSFERENCIA",
      sena: "0",
      estadoPedido: "POR_PEDIR",
      estadoPago: "PENDIENTE",
      lineas: [LINEA_VACIA],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lineas" });

  useEffect(() => {
    if (open) {
      form.reset({
        fecha: today,
        cliente: "",
        metodoPago: "TRANSFERENCIA",
        sena: "0",
        estadoPedido: "POR_PEDIR",
        estadoPago: "PENDIENTE",
        lineas: [LINEA_VACIA],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = async (values: FormValues) => {
    const body = {
      fecha: values.fecha,
      cliente: values.cliente,
      metodoPago: values.metodoPago,
      sena: parseInt(values.sena || "0") || 0,
      estadoPedido: values.estadoPedido,
      estadoPago: values.estadoPago,
      lineas: values.lineas.map((l) => ({
        productoId: l.productoId,
        cantidad: parseInt(l.cantidad),
        precioUnitario: parseInt(l.precioUnitario || "0") || 0,
      })),
    };

    const res = await fetch("/api/pedidos/grupo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo pedido</DialogTitle>
        </DialogHeader>
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

            <div className="space-y-2">
              {fields.map((f, index) => (
                <LineaPedido
                  key={f.id}
                  form={form}
                  index={index}
                  productos={productos}
                  onRemove={() => remove(index)}
                  removable={fields.length > 1}
                />
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => append(LINEA_VACIA)}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Agregar producto
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                    <FormLabel>Seña del pedido ($)</FormLabel>
                    <FormControl><Input type="number" min="0" {...field} /></FormControl>
                    <p className="text-xs text-muted-foreground">Aplica al total, no por producto</p>
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
                    <p className="text-xs text-muted-foreground">Se aplica a todos los productos, luego se puede cambiar por separado</p>
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

            <ResumenPedido control={form.control} />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Guardando..." : "Registrar pedido"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
