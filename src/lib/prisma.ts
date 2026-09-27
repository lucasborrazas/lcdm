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
// por si el volumen se recrea desde cero.
if (process.env.DATABASE_URL) {
  prisma.$queryRawUnsafe("PRAGMA journal_mode=WAL;").catch(() => {});
}
