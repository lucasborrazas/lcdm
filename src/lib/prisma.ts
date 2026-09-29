import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";

type PrismaClientInstance = InstanceType<typeof PrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientInstance | undefined;
};

console.error("[diag] TURSO_DATABASE_URL set?", !!process.env.TURSO_DATABASE_URL);
console.error("[diag] TURSO_AUTH_TOKEN set?", !!process.env.TURSO_AUTH_TOKEN);

const adapter = new PrismaLibSQL({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

console.error("[diag] adapter constructed:", adapter?.constructor?.name, "provider:", (adapter as any)?.provider);

export const prisma: PrismaClientInstance =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
