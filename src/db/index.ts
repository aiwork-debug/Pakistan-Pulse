import "server-only";

import { sql } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

export type Database = PostgresJsDatabase<typeof schema>;
export type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

const globalForDb = globalThis as unknown as { pulseDb?: Database };

function createDb(): Database {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local (see .env.example).");
  }
  // prepare: false keeps the client compatible with Supabase's transaction pooler.
  const client = postgres(url, { prepare: false, max: 10 });
  return drizzle(client, { schema });
}

/**
 * Privileged connection. It connects as the database owner and BYPASSES Row Level Security.
 * Only use it for reads that callers have already authorised in code (for example a
 * super admin reading auth.users). Everything else goes through withRls().
 */
export function getDb(): Database {
  if (!globalForDb.pulseDb) globalForDb.pulseDb = createDb();
  return globalForDb.pulseDb;
}

/**
 * Runs `fn` in a transaction as the Supabase `anon` role (uid = null) or as the
 * `authenticated` role for `uid`, so every RLS policy applies exactly as it would for
 * a request through the Supabase API. `uid` must come from a verified Supabase session.
 */
export async function withRls<T>(uid: string | null, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return getDb().transaction(async (tx) => {
    const claims = JSON.stringify(uid ? { sub: uid, role: "authenticated" } : { role: "anon" });
    await tx.execute(
      sql`select set_config('request.jwt.claims', ${claims}, true), set_config('request.jwt.claim.sub', ${uid ?? ""}, true)`,
    );
    await tx.execute(sql.raw(uid ? "set local role authenticated" : "set local role anon"));
    return fn(tx);
  });
}
