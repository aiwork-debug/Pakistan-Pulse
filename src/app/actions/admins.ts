"use server";

import { and, count, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { withRls, type Tx } from "@/db";
import { posts, profiles } from "@/db/schema";
import { pgErrorCode, writeAudit } from "@/lib/audit";
import { inviteAdminSchema, type InviteAdminValues } from "@/lib/auth-schemas";
import { MAX_ACTIVE_ADMINS, isUuid } from "@/lib/dashboard-data";
import { isDemoMode } from "@/lib/demo/mode";
import { demoDeleteAdmin, demoInviteAdmin, demoSetAdminStatus } from "@/lib/demo/mutations";
import { absoluteUrl } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdminActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string; code?: "ADMIN_LIMIT_REACHED" };

export type DeleteMode = "archive" | "unpublish";

const NOT_ALLOWED = "Only a super admin can manage admins.";
const LIMIT_MESSAGE = `There can be at most ${MAX_ACTIVE_ADMINS} active admins. Suspend or delete one first.`;

class LimitReached extends Error {}
class NotFound extends Error {}

function finish(result: AdminActionResult): AdminActionResult {
  if (result.ok) revalidatePath("/control");
  return result;
}

/**
 * Serialises admin-limit checks across concurrent requests. The lock is held until the
 * transaction ends, so the count and the status change happen atomically.
 */
async function lockAdminLimit(tx: Tx) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext('pulse_admin_limit'))`);
}

async function activeAdminCount(tx: Tx, excludeId?: string): Promise<number> {
  const filters = [eq(profiles.role, "ADMIN"), eq(profiles.status, "ACTIVE")];
  if (excludeId) filters.push(ne(profiles.id, excludeId));
  const [{ value }] = await tx.select({ value: count() }).from(profiles).where(and(...filters));
  return value;
}

async function lockAdmin(tx: Tx, id: string) {
  const [row] = await tx
    .select({ id: profiles.id, status: profiles.status, username: profiles.username })
    .from(profiles)
    .where(and(eq(profiles.id, id), eq(profiles.role, "ADMIN")))
    .for("update")
    .limit(1);
  if (!row) throw new NotFound();
  return row;
}

export async function suspendAdminAction(adminId: string): Promise<AdminActionResult> {
  const session = await requireRole("SUPER_ADMIN");
  if (!session) return { ok: false, error: NOT_ALLOWED };
  if (!isUuid(adminId)) return { ok: false, error: "Admin not found." };
  if (isDemoMode()) return finish(demoSetAdminStatus(session, adminId, "SUSPENDED", MAX_ACTIVE_ADMINS, LIMIT_MESSAGE));

  try {
    await withRls(session.userId, async (tx) => {
      const admin = await lockAdmin(tx, adminId);
      if (admin.status !== "ACTIVE") throw new Error("Only active admins can be suspended.");
      await tx.update(profiles).set({ status: "SUSPENDED" }).where(eq(profiles.id, adminId));
      await writeAudit(tx, {
        actorId: session.userId,
        action: "ADMIN_SUSPENDED",
        targetType: "profile",
        targetId: adminId,
        metadata: { username: admin.username },
      });
    });
  } catch (error) {
    if (error instanceof NotFound) return { ok: false, error: "Admin not found." };
    if (error instanceof Error && error.message.startsWith("Only")) return { ok: false, error: error.message };
    console.error("suspendAdminAction failed", error);
    return { ok: false, error: "The admin could not be suspended. Please try again." };
  }
  revalidatePath("/control");
  return { ok: true, message: "Admin suspended. They are signed out of the dashboard." };
}

export async function reactivateAdminAction(adminId: string): Promise<AdminActionResult> {
  const session = await requireRole("SUPER_ADMIN");
  if (!session) return { ok: false, error: NOT_ALLOWED };
  if (!isUuid(adminId)) return { ok: false, error: "Admin not found." };
  if (isDemoMode()) return finish(demoSetAdminStatus(session, adminId, "ACTIVE", MAX_ACTIVE_ADMINS, LIMIT_MESSAGE));

  try {
    await withRls(session.userId, async (tx) => {
      await lockAdminLimit(tx);
      const admin = await lockAdmin(tx, adminId);
      if (admin.status !== "SUSPENDED") throw new Error("Only suspended admins can be reactivated.");
      if ((await activeAdminCount(tx, adminId)) >= MAX_ACTIVE_ADMINS) throw new LimitReached();
      await tx.update(profiles).set({ status: "ACTIVE" }).where(eq(profiles.id, adminId));
      await writeAudit(tx, {
        actorId: session.userId,
        action: "ADMIN_REACTIVATED",
        targetType: "profile",
        targetId: adminId,
        metadata: { username: admin.username },
      });
    });
  } catch (error) {
    if (error instanceof LimitReached) return { ok: false, error: LIMIT_MESSAGE, code: "ADMIN_LIMIT_REACHED" };
    if (error instanceof NotFound) return { ok: false, error: "Admin not found." };
    if (error instanceof Error && error.message.startsWith("Only")) return { ok: false, error: error.message };
    console.error("reactivateAdminAction failed", error);
    return { ok: false, error: "The admin could not be reactivated. Please try again." };
  }
  revalidatePath("/control");
  return { ok: true, message: "Admin reactivated." };
}

/**
 * Soft delete: the profile becomes ARCHIVED (treated as logged out everywhere).
 * - archive: every story by this admin becomes ARCHIVED.
 * - unpublish: their PUBLISHED stories move back to DRAFT.
 */
export async function deleteAdminAction(adminId: string, mode: DeleteMode): Promise<AdminActionResult> {
  const session = await requireRole("SUPER_ADMIN");
  if (!session) return { ok: false, error: NOT_ALLOWED };
  if (!isUuid(adminId)) return { ok: false, error: "Admin not found." };
  if (mode !== "archive" && mode !== "unpublish") return { ok: false, error: "Choose what happens to their stories." };
  if (isDemoMode()) {
    const result = demoDeleteAdmin(session, adminId, mode);
    return finish(result.ok ? { ok: true, message: result.message } : result);
  }

  let affected = 0;
  try {
    await withRls(session.userId, async (tx) => {
      const admin = await lockAdmin(tx, adminId);
      if (admin.status === "ARCHIVED") throw new Error("Only active or suspended admins can be deleted.");
      await tx.update(profiles).set({ status: "ARCHIVED" }).where(eq(profiles.id, adminId));

      const changed =
        mode === "archive"
          ? await tx
              .update(posts)
              .set({ status: "ARCHIVED" })
              .where(and(eq(posts.authorId, adminId), ne(posts.status, "ARCHIVED")))
              .returning({ id: posts.id })
          : await tx
              .update(posts)
              .set({ status: "DRAFT" })
              .where(and(eq(posts.authorId, adminId), eq(posts.status, "PUBLISHED")))
              .returning({ id: posts.id });
      affected = changed.length;

      await writeAudit(tx, {
        actorId: session.userId,
        action: "ADMIN_DELETED",
        targetType: "profile",
        targetId: adminId,
        metadata: { username: admin.username, mode, affectedPosts: affected },
      });
    });
  } catch (error) {
    if (error instanceof NotFound) return { ok: false, error: "Admin not found." };
    if (error instanceof Error && error.message.startsWith("Only")) return { ok: false, error: error.message };
    console.error("deleteAdminAction failed", error);
    return { ok: false, error: "The admin could not be deleted. Please try again." };
  }

  revalidatePath("/control");
  const storyText = `${affected} ${affected === 1 ? "story" : "stories"}`;
  return {
    ok: true,
    message:
      mode === "archive"
        ? `Admin deleted. ${storyText} archived.`
        : `Admin deleted. ${storyText} moved to drafts.`,
  };
}

/**
 * Invites a new admin by email through the Supabase Auth admin API and creates their
 * profile. The active-admin limit is checked under the same lock and transaction.
 */
export async function inviteAdminAction(values: InviteAdminValues): Promise<AdminActionResult> {
  const session = await requireRole("SUPER_ADMIN");
  if (!session) return { ok: false, error: NOT_ALLOWED };

  const parsed = inviteAdminSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  const { email, displayName, username } = parsed.data;
  if (isDemoMode()) {
    return finish(demoInviteAdmin(session, { email, displayName, username }, MAX_ACTIVE_ADMINS, LIMIT_MESSAGE));
  }

  const adminClient = createSupabaseAdminClient();
  let invitedUserId: string | null = null;

  try {
    await withRls(session.userId, async (tx) => {
      await lockAdminLimit(tx);
      if ((await activeAdminCount(tx)) >= MAX_ACTIVE_ADMINS) throw new LimitReached();

      const [taken] = await tx
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.username, username))
        .limit(1);
      if (taken) throw new Error("That username is already taken.");

      const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo: absoluteUrl("/auth/confirm?next=/update-password"),
        data: { display_name: displayName },
      });
      if (error || !data.user) throw new Error(error?.message ?? "The invitation could not be sent.");
      invitedUserId = data.user.id;

      await tx.insert(profiles).values({
        id: data.user.id,
        username,
        displayName,
        role: "ADMIN",
        status: "ACTIVE",
      });
      await writeAudit(tx, {
        actorId: session.userId,
        action: "ADMIN_CREATED",
        targetType: "profile",
        targetId: data.user.id,
        metadata: { username, via: "invite" },
      });
    });
  } catch (error) {
    // The profile insert rolled back; remove the auth user so the invite can be retried.
    if (invitedUserId) await adminClient.auth.admin.deleteUser(invitedUserId);
    if (error instanceof LimitReached) return { ok: false, error: LIMIT_MESSAGE, code: "ADMIN_LIMIT_REACHED" };
    if (pgErrorCode(error).code === "23505") {
      return { ok: false, error: "An account with that email or username already exists." };
    }
    if (error instanceof Error && !pgErrorCode(error).code) return { ok: false, error: error.message };
    console.error("inviteAdminAction failed", error);
    return { ok: false, error: "The admin could not be invited. Please try again." };
  }

  revalidatePath("/control");
  return { ok: true, message: `Invitation sent to ${email}.` };
}
