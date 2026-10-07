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
import { EDADES_DISPONIBLES, montoPorMetodoPago } from "@/lib/torneo";
import type { HorarioConCupo, InscripcionConHorario, TorneoConResumen } from "@/lib/types";
import { useCierreProtegido, ProtegerCierre } from "@/components/shared/CierreProtegido";

const SIN_EDAD = "SIN_ESPECIFICAR";

const schema = z.object({
  nombre: z.string().min(1, "Requerido"),
  edad: z.string(),
  horarioId: z.string().min(1, "Seleccione un horario"),
  metodoPago: z.enum(["NO_PAGO", "EFECTIVO", "TRANSFERENCIA"]),
  monto: z.string(),
});

type FormValues = z.infer<typeof schema>;

export function InscripcionDialog({
  open,
  onOpenChange,
  inscripcion,
  horarios,
  torneo,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  inscripcion: InscripcionConHorario | null;
  horarios: HorarioConCupo[];
  torneo: TorneoConResumen | null;
  onSuccess: () => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: "", edad: SIN_EDAD, horarioId: "", metodoPago: "NO_PAGO", monto: "" },
  });
  const proteccion = useCierreProtegido({ open, onOpenChange, dirty: form.formState.isDirty });

  useEffect(() => {
    if (inscripcion) {
      const metodoPago = inscripcion.pago ? inscripcion.metodoPago ?? "NO_PAGO" : "NO_PAGO";
      form.reset({
        nombre: inscripcion.nombre,
        edad: inscripcion.edad ?? SIN_EDAD,
        horarioId: inscripcion.horarioId,
        metodoPago,
        monto: inscripcion.monto?.toString() ?? "",
      });
    } else {
      form.reset({ nombre: "", edad: SIN_EDAD, horarioId: "", metodoPago: "NO_PAGO", monto: "" });
    }
  }, [inscripcion, open]);

  const onMetodoPagoChange = (valor: string, onChange: (v: string) => void) => {
    onChange(valor);
    if (!torneo) return;
    const monto = montoPorMetodoPago(torneo, valor === "NO_PAGO" ? null : (valor as "EFECTIVO" | "TRANSFERENCIA"));
    form.setValue("monto", monto != null ? monto.toString() : "");
  };

  const onSubmit = async (values: FormValues) => {
    const body = {
      nombre: values.nombre,
      edad: values.edad === SIN_EDAD ? null : values.edad,
      horarioId: values.horarioId,
      pago: values.metodoPago !== "NO_PAGO",
      metodoPago: values.metodoPago === "NO_PAGO" ? null : values.metodoPago,
      monto: values.metodoPago === "NO_PAGO" ? null : (parseInt(values.monto) || 0),
    };

    const url = inscripcion ? `/api/torneo/inscripciones/${inscripcion.id}` : "/api/torneo/inscripciones";
    const method = inscripcion ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) onSuccess();
  };

  const metodoPagoActual = form.watch("metodoPago");

  return (
    <Dialog open={open} onOpenChange={proteccion.onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{inscripcion ? "Editar inscripción" : "Nueva inscripción"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del alumno</FormLabel>
                  <FormControl><Input placeholder="Nombre y apellido" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="edad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Edad escolar</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Elegir..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={SIN_EDAD}>Sin especificar</SelectItem>
                        {EDADES_DISPONIBLES.map((e) => (
                          <SelectItem key={e} value={e}>{e}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="horarioId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horario</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Elegir..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {horarios.filter((h) => h.activo).map((h) => (
                          <SelectItem key={h.id} value={h.id}>
                            {h.hora} — {h.grupoEdad.nombre}
                            {h.cupoMaximo != null ? ` (${h.inscriptos}/${h.cupoMaximo})` : ` (${h.inscriptos})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="metodoPago"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pago</FormLabel>
                    <Select value={field.value} onValueChange={(v) => onMetodoPagoChange(v, field.onChange)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NO_PAGO">Sin pagar</SelectItem>
                        <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                        <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="monto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        disabled={metodoPagoActual === "NO_PAGO"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => proteccion.onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </Form>
        <ProtegerCierre proteccion={proteccion} />
      </DialogContent>
    </Dialog>
  );
}
