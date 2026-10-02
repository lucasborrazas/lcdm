import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";

type PrismaClientInstance = InstanceType<typeof PrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientInstance | undefined;
};

const onVercel = !!process.env.VERCEL;

const adapter = new PrismaLibSQL(
  onVercel
    ? { url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN }
    : { url: process.env.DATABASE_URL! }
);

export const prisma: PrismaClientInstance =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
