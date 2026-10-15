import { z } from "zod";

// Una familia = un bono, con uno o mas chicos. 
export const familiaSchema = z.object({
  turnoId: z.string().min(1),
  nombre: z.string().trim().min(1),
  metodoPago: z.enum(["EFECTIVO", "TRANSFERENCIA"]).nullable().optional(),
  monto: z.number().int().nonnegative(),
  chicos: z
    .array(
      z.object({
        nombre: z.string().trim().min(1),
        genero: z.enum(["MASCULINO", "FEMENINO"]),
      }),
    )
    .min(1),
});
