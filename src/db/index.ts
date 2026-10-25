import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

/**
 * A single pooled connection is reused across hot reloads in development and
 * across invocations of the same serverless function in production.
 *
 * Use the **pooled** Neon connection string (`...-pooler...`) on Vercel and
 * keep `max` small: serverless platforms create many short-lived instances.
 */
const globalForDb = globalThis as unknown as { hunarPool?: Pool };

function createPool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.warn(
      "[db] DATABASE_URL is not set. Database-backed pages will fail until it is configured.",
    );
  }

  const isRemote = Boolean(
    connectionString &&
      !connectionString.includes("localhost") &&
      !connectionString.includes("127.0.0.1"),
  );

  // Neon connection strings carry `sslmode=verify-full`, so let pg read the
  // TLS settings from the URL. Passing an explicit `ssl` object here would
  // override `verify-full` and silently stop verifying the certificate.
  return new Pool({
    connectionString,
    max: process.env.NODE_ENV === "production" ? 3 : 10,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    ...(isRemote && !/sslmode=/.test(connectionString ?? "") ? { ssl: true } : {}),
  });
}

export const pool = globalForDb.hunarPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.hunarPool = pool;
}

export const db = drizzle(pool, { schema });

export type Database = typeof db;
export { schema };
