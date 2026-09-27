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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ProductoConStock } from "@/lib/types";

const schema = z.object({
  temporada: z.enum(["VERANO", "INVIERNO"]),
  genero: z.enum(["MASCULINO", "FEMENINO"]),
  nombre: z.string().min(1, "Requerido"),
  talle: z.string().min(1, "Requerido"),
  costoActual: z.string().optional(),
  precioVenta: z.string().min(1, "Requerido"),
  stockMinimo: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function ProductoDialog({
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
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      temporada: "VERANO",
      genero: "MASCULINO",
      nombre: "",
      talle: "",
      costoActual: "",
      precioVenta: "",
      stockMinimo: "",
    },
  });

  useEffect(() => {
    if (producto) {
      form.reset({
        temporada: producto.temporada,
        genero: producto.genero,
        nombre: producto.nombre,
        talle: producto.talle,
        costoActual: producto.costoActual?.toString() ?? "",
        precioVenta: producto.precioVenta.toString(),
        stockMinimo: producto.stockMinimo?.toString() ?? "",
      });
    } else {
      form.reset({
        temporada: "VERANO",
        genero: "MASCULINO",
        nombre: "",
        talle: "",
        costoActual: "",
        precioVenta: "",
        stockMinimo: "",
      });
    }
  }, [producto, open]);

  const onSubmit = async (values: FormValues) => {
    const body = {
      temporada: values.temporada,
      genero: values.genero,
      nombre: values.nombre,
      talle: values.talle,
      costoActual: values.costoActual ? parseInt(values.costoActual) : null,
      precioVenta: parseInt(values.precioVenta),
      stockMinimo: values.stockMinimo ? parseInt(values.stockMinimo) : null,
    };

    const url = producto ? `/api/productos/${producto.id}` : "/api/productos";
    const method = producto ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{producto ? "Editar producto" : "Nuevo producto"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="temporada"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temporada</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="VERANO">Verano</SelectItem>
                        <SelectItem value="INVIERNO">Invierno</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="genero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Género</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MASCULINO">Masculino</SelectItem>
                        <SelectItem value="FEMENINO">Femenino</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Conjunto de Invierno" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="talle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Talle</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: M, 10, XL, Único" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="costoActual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo ($)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="precioVenta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio venta ($)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="stockMinimo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock mínimo (opcional)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
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
