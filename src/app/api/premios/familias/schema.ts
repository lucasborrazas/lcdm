import { z } from "zod";

// Una familia = un bono, con uno o mas chicos. El total de personas incluye a los chicos.
export const familiaSchema = z
  .object({
    turnoId: z.string().min(1),
    nombre: z.string().trim().min(1),
    telefono: z.string().trim().nullable().optional(),
    totalPersonas: z.number().int().min(1),
    metodoPago: z.enum(["EFECTIVO", "TRANSFERENCIA"]).nullable().optional(),
    monto: z.number().int().nonnegative(),
    chicos: z
      .array(z.object({ nombre: z.string().trim().min(1), genero: z.enum(["MASCULINO", "FEMENINO"]) }))
      .min(1),
  })
  .refine((d) => d.totalPersonas >= d.chicos.length, {
    message: "El total de personas incluye a los chicos",
    path: ["totalPersonas"],
  });
