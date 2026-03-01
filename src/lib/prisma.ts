import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
    // Supabase uses PgBouncer (transaction mode) which does not support
    // prepared statements. Adding pgbouncer=true disables them in Prisma.
    // connection_limit=1 is recommended for Vercel serverless functions.
    const base = process.env.DATABASE_URL ?? "";
    const separator = base.includes("?") ? "&" : "?";
    const url = `${base}${separator}pgbouncer=true&connection_limit=1`;

    return new PrismaClient({
        datasources: { db: { url } },
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
};

declare const globalThis: {
    prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
