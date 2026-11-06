import type { Role } from "@/lib/types";

/**
 * UI-only permission checks. They decide what to show or hide.
 * They are not a security boundary: layouts guard routes, server actions re-check the
 * session, and RLS guards the database. This module stays free of server-only imports
 * so client components can use it.
 */
export type Action =
  | "view:dashboard"
  | "manage:own-posts"
  | "publish:own-posts"
  | "view:control"
  | "manage:admins"
  | "manage:homepage"
  | "view:users"
  | "view:audit-log";

const PERMISSIONS: Record<Role, readonly Action[]> = {
  // Admins publish their own stories directly. No approval step exists.
  ADMIN: ["view:dashboard", "manage:own-posts", "publish:own-posts"],
  SUPER_ADMIN: ["view:control", "manage:admins", "manage:homepage", "view:users", "view:audit-log"],
};

export function can(role: Role | null | undefined, action: Action): boolean {
  if (!role) return false;
  return PERMISSIONS[role].includes(action);
}

export function dashboardHrefFor(role: Role): string {
  return role === "SUPER_ADMIN" ? "/control" : "/dashboard";
}

export function roleLabel(role: Role): string {
  return role === "SUPER_ADMIN" ? "Super admin" : "Admin";
}
