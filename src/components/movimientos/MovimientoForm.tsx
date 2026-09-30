"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, useWatch, type Control } from "react-hook-form";
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
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import { formatearMoneda } from "@/lib/calculations";
import { InfoTip } from "@/components/shared/InfoTip";
import type { ProductoConStock } from "@/lib/types";

type Props = { onSuccess: () => void };

const lineaSchema = z.object({
  productoId: z.string().min(1, "Seleccione un producto"),
  cantidad: z.string().min(1, "Requerido"),
  totalLineaCompra: z.string().optional(),
  costoUnitarioCompra: z.string().optional(),
});

const ingresoSchema = z.object({
  fecha: z.string().min(1, "Requerido"),
  motivo: z.string().min(1, "Requerido"),
  notas: z.string().optional(),
  compraId: z.string().optional(),
  envioTotalCompra: z.string().optional(),
  lineas: z.array(lineaSchema).min(1),
});

type IngresoFormValues = z.infer<typeof ingresoSchema>;

const LINEA_VACIA = { productoId: "", cantidad: "", totalLineaCompra: "", costoUnitarioCompra: "" };

function LineaCompra({
  control,
  index,
  productos,
  onRemove,
  removable,
}: {
  control: Control<IngresoFormValues>;
  index: number;
  productos: ProductoConStock[];
  onRemove: () => void;
  removable: boolean;
}) {
  const totalLinea = useWatch({ control, name: `lineas.${index}.totalLineaCompra` });
  const costoUnitario = useWatch({ control, name: `lineas.${index}.costoUnitarioCompra` });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 items-start border rounded-md p-3">
      <FormField
        control={control}
        name={`lineas.${index}.productoId`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">Producto</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
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
      <FormField
        control={control}
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
        control={control}
        name={`lineas.${index}.totalLineaCompra`}
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-1">
              <FormLabel className="text-xs">Total línea ($)</FormLabel>
              <InfoTip>
                Lo que pagaste en total por esta línea (todas las unidades juntas, sin el envío).
                A partir de esto se calcula el costo por unidad solo.
              </InfoTip>
            </div>
            <FormControl>
              <Input type="number" placeholder="0" {...field} disabled={!!costoUnitario} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`lineas.${index}.costoUnitarioCompra`}
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-1">
              <FormLabel className="text-xs">o costo unit. ($)</FormLabel>
              <InfoTip>
                Alternativa a "Total línea": el costo de una sola unidad, si ya lo sabés directo.
                Completá uno de los dos, no ambos.
              </InfoTip>
            </div>
            <FormControl>
              <Input type="number" placeholder="0" {...field} disabled={!!totalLinea} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
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
  );
}

function IngresoCompraForm({ productos, onSuccess }: { productos: ProductoConStock[] } & Props) {
  const [enviado, setEnviado] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const form = useForm<IngresoFormValues>({
    resolver: zodResolver(ingresoSchema),
    defaultValues: {
      fecha: today,
      motivo: "",
      notas: "",
      compraId: "",
      envioTotalCompra: "",
      lineas: [LINEA_VACIA],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lineas" });
  const lineasWatch = form.watch("lineas");

  const totalMercaderia = lineasWatch.reduce((s, l) => {
    const cantidad = parseInt(l.cantidad || "0") || 0;
    if (l.totalLineaCompra) return s + (parseInt(l.totalLineaCompra) || 0);
    const unitario = parseInt(l.costoUnitarioCompra || "0") || 0;
    return s + cantidad * unitario;
  }, 0);
  const envio = parseInt(form.watch("envioTotalCompra") || "0") || 0;

  const onSubmit = async (values: IngresoFormValues) => {
    const body = {
      fecha: values.fecha,
      motivo: values.motivo,
      notas: values.notas || undefined,
      compraId: values.compraId || undefined,
      envioTotalCompra: values.envioTotalCompra ? parseInt(values.envioTotalCompra) : undefined,
      lineas: values.lineas.map((l) => ({
        productoId: l.productoId,
        cantidad: parseInt(l.cantidad),
        totalLineaCompra: l.totalLineaCompra ? parseInt(l.totalLineaCompra) : undefined,
        costoUnitarioCompra: l.costoUnitarioCompra ? parseInt(l.costoUnitarioCompra) : undefined,
      })),
    };

    const res = await fetch("/api/movimientos/compra", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setEnviado(true);
      form.reset({ fecha: today, motivo: "", notas: "", compraId: "", envioTotalCompra: "", lineas: [LINEA_VACIA] });
      setTimeout(() => setEnviado(false), 2000);
      onSuccess();
    }
  };

  return (
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
                <FormControl><Input placeholder="Ej: Compra a proveedor" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="compraId"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-1">
                  <FormLabel>ID Compra (opcional)</FormLabel>
                  <InfoTip>
                    Un identificador tuyo para agrupar esta compra (por ejemplo, el número de
                    factura del proveedor). Es solo para tu referencia — si lo dejás vacío, se
                    genera uno automático y no cambia ningún cálculo.
                  </InfoTip>
                </div>
                <FormControl><Input placeholder="Ej: COMP-001" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
        </div>

        <div className="space-y-2">
          {fields.map((f, index) => (
            <LineaCompra
              key={f.id}
              control={form.control}
              index={index}
              productos={productos}
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
              <FormControl><Textarea placeholder="Observaciones..." rows={2} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />
        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            Mercadería: <strong className="text-foreground">{formatearMoneda(totalMercaderia)}</strong>
            {envio > 0 && <> + envío <strong className="text-foreground">{formatearMoneda(envio)}</strong></>}
            {" = "}
            <strong className="text-foreground">{formatearMoneda(totalMercaderia + envio)}</strong>
          </div>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Guardando..." : enviado ? "¡Guardado!" : "Registrar compra"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

const egresoSchema = z.object({
  fecha: z.string().min(1, "Requerido"),
  productoId: z.string().min(1, "Seleccione un producto"),
  cantidad: z.string().min(1, "Requerido"),
  motivo: z.string().min(1, "Requerido"),
  notas: z.string().optional(),
});

type EgresoFormValues = z.infer<typeof egresoSchema>;

function EgresoForm({ productos, onSuccess }: { productos: ProductoConStock[] } & Props) {
  const [enviado, setEnviado] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const form = useForm<EgresoFormValues>({
    resolver: zodResolver(egresoSchema),
    defaultValues: { fecha: today, productoId: "", cantidad: "", motivo: "", notas: "" },
  });

  const productoSeleccionado = productos.find((p) => p.id === form.watch("productoId"));

  const onSubmit = async (values: EgresoFormValues) => {
    const res = await fetch("/api/movimientos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fecha: values.fecha,
        productoId: values.productoId,
        tipo: "EGRESO",
        cantidad: parseInt(values.cantidad),
        motivo: values.motivo,
        notas: values.notas || undefined,
      }),
    });

    if (res.ok) {
      setEnviado(true);
      form.reset({ fecha: today, productoId: "", cantidad: "", motivo: "", notas: "" });
      setTimeout(() => setEnviado(false), 2000);
      onSuccess();
    }
  };

  return (
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
        </div>

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
                <FormControl><Input type="number" min="1" {...field} /></FormControl>
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
                <FormControl><Input placeholder="Ej: Rotura, pérdida" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (opcional)</FormLabel>
              <FormControl><Textarea placeholder="Observaciones..." rows={2} {...field} /></FormControl>
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
  );
}

export function MovimientoForm({ onSuccess }: Props) {
  const [productos, setProductos] = useState<ProductoConStock[]>([]);
  const [tipo, setTipo] = useState<"INGRESO" | "EGRESO">("INGRESO");

  useEffect(() => {
    fetch("/api/productos").then((r) => r.json()).then(setProductos);
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="text-base">Registrar movimiento</CardTitle>
        <Select value={tipo} onValueChange={(v) => setTipo(v as "INGRESO" | "EGRESO")}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="INGRESO">Ingreso (compra)</SelectItem>
            <SelectItem value="EGRESO">Egreso</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {tipo === "INGRESO" ? (
          <IngresoCompraForm productos={productos} onSuccess={onSuccess} />
        ) : (
          <EgresoForm productos={productos} onSuccess={onSuccess} />
        )}
      </CardContent>
    </Card>
  );
}
