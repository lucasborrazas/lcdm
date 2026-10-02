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
import { EDADES_DISPONIBLES } from "@/lib/torneo";
import type { HorarioConCupo, InscripcionConHorario } from "@/lib/types";

const schema = z.object({
  nombre: z.string().min(1, "Requerido"),
  edad: z.string().min(1, "Requerido"),
  horarioId: z.string().min(1, "Seleccione un horario"),
});

type FormValues = z.infer<typeof schema>;

export function InscripcionDialog({
  open,
  onOpenChange,
  inscripcion,
  horarios,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  inscripcion: InscripcionConHorario | null;
  horarios: HorarioConCupo[];
  onSuccess: () => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: "", edad: "", horarioId: "" },
  });

  useEffect(() => {
    if (inscripcion) {
      form.reset({
        nombre: inscripcion.nombre,
        edad: inscripcion.edad,
        horarioId: inscripcion.horarioId,
      });
    } else {
      form.reset({ nombre: "", edad: "", horarioId: "" });
    }
  }, [inscripcion, open]);

  const onSubmit = async (values: FormValues) => {
    const url = inscripcion ? `/api/torneo/inscripciones/${inscripcion.id}` : "/api/torneo/inscripciones";
    const method = inscripcion ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (res.ok) onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                    <FormLabel>Edad</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Elegir..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EDADES_DISPONIBLES.map((e) => (
                          <SelectItem key={e} value={e}>{e} años</SelectItem>
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
