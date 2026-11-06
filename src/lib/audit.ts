import "server-only";

import type { Tx } from "@/db";
import { auditLog } from "@/db/schema";

export type AuditAction =
  | "POST_CREATED"
  | "POST_UPDATED"
  | "POST_PUBLISHED"
  | "POST_UNPUBLISHED"
  | "POST_ARCHIVED"
  | "MEDIA_UPLOADED"
  | "MEDIA_UPDATED"
  | "MEDIA_DELETED"
  | "PROFILE_UPDATED"
  | "ADMIN_CREATED"
  | "ADMIN_SUSPENDED"
  | "ADMIN_REACTIVATED"
  | "ADMIN_DELETED"
  | "HOMEPAGE_UPDATED";

/**
 * Appends an audit entry inside the caller's transaction, so the entry and the change it
 * describes commit or roll back together. RLS only allows actor_id = auth.uid().
 */
export async function writeAudit(
  tx: Tx,
  entry: {
    actorId: string;
    action: AuditAction;
    targetType: "post" | "media" | "profile" | "homepage";
    targetId: string;
    metadata?: Record<string, unknown>;
  },
) {
  await tx.insert(auditLog).values({
    actorId: entry.actorId,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    metadata: entry.metadata ?? {},
  });
}

/** Postgres error code from a postgres-js error, possibly wrapped by Drizzle. */
export function pgErrorCode(error: unknown): { code?: string; constraint?: string } {
  const candidates = [error, (error as { cause?: unknown } | null)?.cause];
  for (const candidate of candidates) {
    if (candidate && typeof candidate === "object" && "code" in candidate) {
      const { code, constraint_name: constraint } = candidate as {
        code?: unknown;
        constraint_name?: unknown;
      };
      return {
        code: typeof code === "string" ? code : undefined,
        constraint: typeof constraint === "string" ? constraint : undefined,
      };
    }
  }
  return {};
}
