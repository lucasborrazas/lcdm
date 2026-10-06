"use client";

import { useEffect, useMemo, useState } from "react";
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
import { InfoTip } from "@/components/shared/InfoTip";
import type { ProductoConStock } from "@/lib/types";
import { useModoCliente } from "@/components/layout/ModoClienteProvider";

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
  productosExistentes = [],
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  producto: ProductoConStock | null;
  productosExistentes?: ProductoConStock[];
  onSuccess: () => void;
}) {
  const { modoCliente } = useModoCliente();
  const [productoBaseKey, setProductoBaseKey] = useState("");

  const combosExistentes = useMemo(() => {
    const map = new Map<string, ProductoConStock>();
    for (const p of productosExistentes) {
      const key = `${p.temporada}|${p.genero}|${p.nombre}`;
      if (!map.has(key)) map.set(key, p);
    }
    return Array.from(map.entries())
      .map(([key, p]) => ({ key, p }))
      .sort((a, b) => a.p.nombre.localeCompare(b.p.nombre));
  }, [productosExistentes]);

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
    setProductoBaseKey("");
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

  const handleElegirBase = (key: string) => {
    setProductoBaseKey(key);
    const base = combosExistentes.find((c) => c.key === key)?.p;
    if (base) {
      form.reset({
        temporada: base.temporada,
        genero: base.genero,
        nombre: base.nombre,
        talle: "",
        costoActual: base.costoActual?.toString() ?? "",
        precioVenta: base.precioVenta.toString(),
        stockMinimo: base.stockMinimo?.toString() ?? "",
      });
    }
  };

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{producto ? "Editar producto" : "Agregar producto"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!producto && combosExistentes.length > 0 && (
              <div>
                <FormLabel>Producto existente (opcional)</FormLabel>
                <Select value={productoBaseKey} onValueChange={handleElegirBase}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Elegir producto ya cargado..." />
                  </SelectTrigger>
                  <SelectContent>
                    {combosExistentes.map(({ key, p }) => (
                      <SelectItem key={key} value={key}>
                        {p.nombre} — {p.temporada === "VERANO" ? "Verano" : "Invierno"}, {p.genero === "MASCULINO" ? "Masc." : "Fem."}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Completa temporada, género, costo y precio. Solo falta el talle nuevo.
                </p>
              </div>
            )}

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
              {!modoCliente && (
                <FormField
                  control={form.control}
                  name="costoActual"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-1">
                        <FormLabel>Costo ($)</FormLabel>
                        <InfoTip>
                          <p>
                            <strong>Dejalo vacío</strong> si es una compra nueva con envío u otros
                            costos a prorratear — se completa solo al cargar el ingreso en Movimientos.
                          </p>
                          <p className="mt-2">
                            <strong>Completalo</strong> solo si ya sabés el costo final (por ejemplo,
                            stock que ya tenías antes de usar el sistema).
                          </p>
                        </InfoTip>
                      </div>
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
