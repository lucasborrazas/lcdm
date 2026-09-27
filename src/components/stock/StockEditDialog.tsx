"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { StockResumen } from "@/lib/types";

const schema = z.object({
  stockInicial: z.string().min(1, "Requerido"),
  alertaMinimo: z.string(),
});

type FormValues = z.infer<typeof schema>;

export function StockEditDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: StockResumen | null;
  onSuccess: () => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { stockInicial: "0", alertaMinimo: "0" },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        stockInicial: item.stockInicial.toString(),
        alertaMinimo: (item.alertaMinimo ?? 0).toString(),
      });
    }
  }, [item, open]);

  const onSubmit = async (values: FormValues) => {
    if (!item) return;
    const res = await fetch(`/api/stock/${item.productoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stockInicial: parseInt(values.stockInicial),
        alertaMinimo: parseInt(values.alertaMinimo) || 0,
      }),
    });
    if (res.ok) onSuccess();
  };

  if (!item) return null;

  const stockActualNuevo =
    parseInt(form.watch("stockInicial") || "0") +
    item.ingresos -
    item.egresos;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar stock</DialogTitle>
          <DialogDescription>
            {item.nombre} — Talle {item.talle}
          </DialogDescription>
        </DialogHeader>

        <div className="text-xs text-muted-foreground space-y-1 bg-muted rounded-md px-3 py-2">
          <p>Ingresos registrados: <strong>+{item.ingresos}</strong></p>
          <p>Egresos registrados: <strong>-{item.egresos}</strong></p>
          <p>Stock actual resultante: <strong>{stockActualNuevo}</strong></p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="stockInicial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock inicial</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="alertaMinimo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alerta mínimo (0 = desactivado)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
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
