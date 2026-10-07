"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Plus, ArrowLeft } from "lucide-react";
import { formatearMoneda } from "@/lib/calculations";
import {
  LineaCompra, LINEA_VACIA, ingresoSchema,
  type IngresoFormValues,
} from "./MovimientoForm";
import type { ProductoConStock } from "@/lib/types";
import type { MovimientoStock } from "@/generated/prisma/client";
import { useCierreProtegido, ProtegerCierre } from "@/components/shared/CierreProtegido";

type Impacto = { productoId: string; productoNombre: string; talle: string; costoAnterior: number | null; costoNuevo: number | null };

export function EditarCompraDialog({
  compraId,
  open,
  onOpenChange,
  onSuccess,
}: {
  compraId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [productos, setProductos] = useState<ProductoConStock[]>([]);
  const [cargando, setCargando] = useState(true);
  const [impactos, setImpactos] = useState<Impacto[] | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [valoresPendientes, setValoresPendientes] = useState<IngresoFormValues | null>(null);

  const form = useForm<IngresoFormValues>({
    resolver: zodResolver(ingresoSchema),
    defaultValues: {
      fecha: "", motivo: "", notas: "", compraId: "", envioTotalCompra: "", valorGeneralCompra: "",
      lineas: [LINEA_VACIA],
    },
  });
  const proteccion = useCierreProtegido({ open, onOpenChange, dirty: form.formState.isDirty });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lineas" });

  useEffect(() => {
    if (!open || !compraId) return;
    setImpactos(null);
    setValoresPendientes(null);
    setCargando(true);

    Promise.all([
      fetch("/api/productos").then((r) => r.json()),
      fetch(`/api/movimientos/compra/${compraId}`).then((r) => r.json()),
    ]).then(([prods, movimientos]: [ProductoConStock[], MovimientoStock[]]) => {
      setProductos(prods);
      const primero = movimientos[0];
      form.reset({
        fecha: new Date(primero.fecha).toISOString().split("T")[0],
        motivo: primero.motivo,
        notas: primero.notas ?? "",
        compraId: primero.compraId ?? "",
        envioTotalCompra: primero.envioTotalCompra != null ? primero.envioTotalCompra.toString() : "",
        valorGeneralCompra: "",
        lineas: movimientos.map((m) => ({
          productoId: m.productoId,
          cantidad: m.cantidad.toString(),
          totalLineaCompra: m.totalLineaCompra != null ? m.totalLineaCompra.toString() : "",
          costoUnitarioCompra: m.totalLineaCompra == null && m.costoUnitarioCompra != null ? m.costoUnitarioCompra.toString() : "",
        })),
      });
      setCargando(false);
    });
  }, [open, compraId]);

  const construirBody = (values: IngresoFormValues) => ({
    fecha: values.fecha,
    motivo: values.motivo,
    notas: values.notas || undefined,
    envioTotalCompra: values.envioTotalCompra ? parseInt(values.envioTotalCompra) : undefined,
    lineas: values.lineas.map((l) => ({
      productoId: l.productoId,
      cantidad: parseInt(l.cantidad),
      totalLineaCompra: l.totalLineaCompra ? parseInt(l.totalLineaCompra) : undefined,
      costoUnitarioCompra: l.costoUnitarioCompra ? parseInt(l.costoUnitarioCompra) : undefined,
    })),
  });

  const onSubmit = async (values: IngresoFormValues) => {
    if (!compraId) return;
    const body = construirBody(values);

    const res = await fetch(`/api/movimientos/compra/${compraId}/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if ((data.impactos ?? []).length > 0) {
      setImpactos(data.impactos);
      setValoresPendientes(values);
    } else {
      await confirmar(values);
    }
  };

  const confirmar = async (values: IngresoFormValues) => {
    if (!compraId) return;
    setGuardando(true);
    const res = await fetch(`/api/movimientos/compra/${compraId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(construirBody(values)),
    });
    setGuardando(false);
    if (res.ok) {
      proteccion.cerrar();
      onSuccess();
    }
  };

  if (impactos) {
    return (
      <Dialog open={open} onOpenChange={proteccion.onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Este cambio afecta el costo promedio</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Al guardar esta edición, el costo promedio ponderado de estos productos va a cambiar
            (por ejemplo, porque hubo otras compras o ventas después):
          </p>
          <div className="space-y-2">
            {impactos.map((i) => (
              <div key={i.productoId} className="flex items-center justify-between text-sm border rounded-md px-3 py-2">
                <span>{i.productoNombre} T.{i.talle}</span>
                <span>
                  {formatearMoneda(i.costoAnterior ?? 0)} → <strong>{formatearMoneda(i.costoNuevo ?? 0)}</strong>
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setImpactos(null)}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Volver
            </Button>
            <Button disabled={guardando} onClick={() => valoresPendientes && confirmar(valoresPendientes)}>
              {guardando ? "Guardando..." : "Confirmar cambios"}
            </Button>
          </div>
          <ProtegerCierre proteccion={proteccion} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={proteccion.onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar compra</DialogTitle>
        </DialogHeader>
        {cargando ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Cargando...</p>
        ) : (
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
                  name="motivo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="envioTotalCompra"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Envío total de la compra ($)</FormLabel>
                    <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
                    <p className="text-xs text-muted-foreground">Se prorratea entre todas las líneas de abajo</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                {fields.map((f, index) => (
                  <LineaCompra
                    key={f.id}
                    form={form}
                    index={index}
                    productos={productos}
                    modoCosto="LINEA"
                    onRemove={() => remove(index)}
                    removable={fields.length > 1}
                  />
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => append(LINEA_VACIA)}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Agregar línea
                </Button>
              </div>

              <FormField
                control={form.control}
                name="notas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas (opcional)</FormLabel>
                    <FormControl><Textarea rows={2} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => proteccion.onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Verificando..." : "Guardar cambios"}
                </Button>
              </div>
            </form>
          </Form>
        )}
        <ProtegerCierre proteccion={proteccion} />
      </DialogContent>
    </Dialog>
  );
}
