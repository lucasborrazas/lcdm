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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatearFecha } from "@/lib/calculations";
import type { ProductoConStock } from "@/lib/types";

const schema = z.object({
  fecha: z.string().min(1, "Requerido"),
  productoId: z.string().min(1, "Seleccione un producto"),
  tipo: z.enum(["INGRESO", "EGRESO"]),
  cantidad: z.string().min(1, "Requerido"),
  motivo: z.string().min(1, "Requerido"),
  notas: z.string().optional(),
  compraId: z.string().optional(),
  costoUnitarioCompra: z.string().optional(),
  totalLineaCompra: z.string().optional(),
  envioTotalCompra: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function MovimientoForm({ onSuccess }: { onSuccess: () => void }) {
  const [productos, setProductos] = useState<ProductoConStock[]>([]);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    fetch("/api/productos").then((r) => r.json()).then(setProductos);
  }, []);

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fecha: today,
      productoId: "",
      tipo: "INGRESO",
      cantidad: "",
      motivo: "",
      notas: "",
      compraId: "",
      costoUnitarioCompra: "",
      totalLineaCompra: "",
      envioTotalCompra: "",
    },
  });

  const tipo = form.watch("tipo");
  const esIngreso = tipo === "INGRESO";

  const onSubmit = async (values: FormValues) => {
    const body: any = {
      fecha: values.fecha,
      productoId: values.productoId,
      tipo: values.tipo,
      cantidad: parseInt(values.cantidad),
      motivo: values.motivo,
      notas: values.notas || undefined,
    };

    if (esIngreso) {
      if (values.compraId) body.compraId = values.compraId;
      if (values.totalLineaCompra) body.totalLineaCompra = parseInt(values.totalLineaCompra);
      else if (values.costoUnitarioCompra) body.costoUnitarioCompra = parseInt(values.costoUnitarioCompra);
      if (values.envioTotalCompra) body.envioTotalCompra = parseInt(values.envioTotalCompra);
    }

    const res = await fetch("/api/movimientos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setEnviado(true);
      form.reset({ fecha: today, productoId: "", tipo: "INGRESO", cantidad: "", motivo: "" });
      setTimeout(() => setEnviado(false), 2000);
      onSuccess();
    }
  };

  const productoSeleccionado = productos.find((p) => p.id === form.watch("productoId"));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Registrar movimiento</CardTitle>
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
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="INGRESO">Ingreso</SelectItem>
                        <SelectItem value="EGRESO">Egreso</SelectItem>
                      </SelectContent>
                    </Select>
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
                          {p.temporada === "VERANO" ? "V" : "I"} {p.genero === "MASCULINO" ? "M" : "F"} — {p.nombre} T.{p.talle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {productoSeleccionado && (
              <div className="text-xs text-muted-foreground bg-muted px-3 py-2 rounded-md">
                Stock actual: <strong>{productoSeleccionado.stockActual}</strong>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cantidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
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
                    <FormControl>
                      <Input placeholder="Ej: Compra a proveedor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {esIngreso && (
              <div className="space-y-4 border rounded-md p-4 bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Datos de compra (opcional)</p>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="compraId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Compra</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: COMP-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="totalLineaCompra"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total línea ($)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="costoUnitarioCompra"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Costo unitario ($)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="envioTotalCompra"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Envío total compra ($)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observaciones..." rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Guardando..." : enviado ? "¡Guardado!" : "Registrar"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
