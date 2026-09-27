import { PrismaClient } from "@/generated/prisma/client";

type PrismaClientInstance = InstanceType<typeof PrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientInstance | undefined;
};

export const prisma: PrismaClientInstance =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// WAL permite lecturas concurrentes mientras hay una escritura en curso.
// Es una propiedad del archivo .db, pero conviene reafirmarla en cada arranque
// por si el volumen se recrea desde cero. Next.js importa este módulo también
// durante `next build` (para analizar las rutas API), momento en el que un
// volumen montado (como el de Railway) todavía ni existe, así que hay que
// evitar tocar la base fuera del arranque real del servidor.
if (process.env.NEXT_PHASE !== "phase-production-build") {
  prisma.$queryRawUnsafe("PRAGMA journal_mode=WAL;").catch(() => {});
}
