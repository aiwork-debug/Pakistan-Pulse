import "server-only";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { DEMO_SESSION_COOKIE, isDemoMode } from "@/lib/demo/mode";
import { getDemoState } from "@/lib/demo/store";
import { withRls } from "@/db";
import { profiles } from "@/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export type Session = {
  userId: string;
  email: string;
  role: Role;
  name: string;
  username: string;
  initials: string;
  avatarGradient: string;
};

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function isRole(value: string): value is Role {
  return value === "ADMIN" || value === "SUPER_ADMIN";
}

/**
 * The signed-in staff member, or null.
 * Null when there is no Supabase user, no profile row, or the profile is not ACTIVE
 * (a suspended or archived admin is treated as logged out).
 * Cached per request.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  if (isDemoMode()) return getDemoSession();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile] = await withRls(user.id, (tx) =>
    tx.select().from(profiles).where(eq(profiles.id, user.id)).limit(1),
  );
  if (!profile || profile.status !== "ACTIVE" || !isRole(profile.role)) return null;

  return {
    userId: user.id,
    email: user.email ?? "",
    role: profile.role,
    name: profile.displayName,
    username: profile.username,
    initials: initialsOf(profile.displayName),
    avatarGradient: profile.avatarGradient,
  };
});

/** Demo mode only: the demo profile whose id is in the demo session cookie. */
async function getDemoSession(): Promise<Session | null> {
  const store = await cookies();
  const id = store.get(DEMO_SESSION_COOKIE)?.value;
  if (!id) return null;
  const profile = getDemoState().profiles.find((candidate) => candidate.id === id);
  if (!profile || profile.status !== "ACTIVE") return null;
  return {
    userId: profile.id,
    email: profile.email,
    role: profile.role,
    name: profile.displayName,
    username: profile.username,
    initials: initialsOf(profile.displayName),
    avatarGradient: profile.avatarGradient,
  };
}

/**
 * For pages. Next renders a page in parallel with its layout, so each protected page checks
 * the role itself as well: anonymous visitors go to /login, other roles go to /403.
 */
export async function requirePageRole(role: Role): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== role) redirect("/403");
  return session;
}

/** Session if the signed-in user has one of `roles`, otherwise null. For server actions. */
export async function requireRole(...roles: Role[]): Promise<Session | null> {
  const session = await getSession();
  return session && roles.includes(session.role) ? session : null;
}
