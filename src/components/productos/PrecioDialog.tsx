"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatearMoneda } from "@/lib/calculations";
import type { ProductoConStock } from "@/lib/types";
import { useModoCliente } from "@/components/layout/ModoClienteProvider";

const schema = z.object({
  costoActual: z.string().optional(),
  precioVenta: z.string().min(1, "Requerido"),
});

type FormValues = z.infer<typeof schema>;

export function PrecioDialog({
  open,
  onOpenChange,
  producto,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  producto: ProductoConStock | null;
  onSuccess: () => void;
}) {
  const { modoCliente } = useModoCliente();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { costoActual: "", precioVenta: "" },
  });

  useEffect(() => {
    if (producto) {
      form.reset({
        costoActual: producto.costoActual?.toString() ?? "",
        precioVenta: producto.precioVenta.toString(),
      });
    }
  }, [producto, open]);

  const onSubmit = async (values: FormValues) => {
    if (!producto) return;
    const res = await fetch(`/api/productos/${producto.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        costoActual: values.costoActual ? parseInt(values.costoActual) : null,
        precioVenta: parseInt(values.precioVenta),
      }),
    });
    if (res.ok) onSuccess();
  };

  if (!producto) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{modoCliente ? "Cambiar precio" : "Cambiar costo / precio"}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          {producto.nombre} — Talle {producto.talle}
        </p>
        <div className="text-xs text-muted-foreground space-y-0.5">
          {!modoCliente && <p>Costo actual: {formatearMoneda(producto.costoActual ?? 0)}</p>}
          <p>Precio actual: {formatearMoneda(producto.precioVenta)}</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* En modo cliente el campo se esconde pero el valor se conserva en el form. */}
            {!modoCliente && (
              <FormField
                control={form.control}
                name="costoActual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nuevo costo ($)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="precioVenta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nuevo precio venta ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
