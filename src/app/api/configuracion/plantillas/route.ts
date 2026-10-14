import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const seccionSchema = z.enum(["TORNEO", "PREMIOS"]);

const schema = z
  .object({
    seccion: seccionSchema,
    hora: z.string().trim().min(1),
    grupoEdadNombre: z.string().trim().nullable().optional(),
  })
  // Los horarios de torneo siempre llevan grupo de edad.
  .refine((d) => d.seccion !== "TORNEO" || !!d.grupoEdadNombre, {
    message: "El grupo de edad es obligatorio en los horarios de torneo",
    path: ["grupoEdadNombre"],
  });

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const seccion = seccionSchema.safeParse(req.nextUrl.searchParams.get("seccion"));
  if (!seccion.success) {
    return NextResponse.json({ error: "Falta seccion (TORNEO o PREMIOS)" }, { status: 400 });
  }
  const plantillas = await prisma.plantillaHorario.findMany({
    where: { seccion: seccion.data },
    include: { grupoEdad: true },
    orderBy: [{ hora: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(plantillas);
}

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { seccion, hora, grupoEdadNombre } = parsed.data;
  const plantilla = await prisma.plantillaHorario.create({
    data: {
      seccion,
      hora,
      ...(grupoEdadNombre
        ? { grupoEdad: { connectOrCreate: { where: { nombre: grupoEdadNombre }, create: { nombre: grupoEdadNombre } } } }
        : {}),
    },
    include: { grupoEdad: true },
  });
  return NextResponse.json(plantilla, { status: 201 });
}
