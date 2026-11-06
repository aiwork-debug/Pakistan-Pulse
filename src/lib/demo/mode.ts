import "server-only";

/**
 * Demo mode is on while Supabase is not configured. In demo mode the app reads and writes
 * dummy data in .data/demo-store.json instead of the database. Setting the four variables
 * from .env.example switches every page and action to Supabase automatically.
 */
export function isDemoMode(): boolean {
  return !(
    process.env.DATABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Cookie holding the demo profile id. Only read in demo mode. */
export const DEMO_SESSION_COOKIE = "pulse_demo_session";

/** Public URL prefix for images uploaded in demo mode (served by src/app/demo-media). */
export const DEMO_MEDIA_PREFIX = "/demo-media/";
