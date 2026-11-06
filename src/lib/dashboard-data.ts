import "server-only";

import { and, count, desc, eq, ilike, inArray, isNull, type SQL } from "drizzle-orm";
import { getDb, withRls } from "@/db";
import { authUsersFull } from "@/db/external";
import { auditLog, homepageSlots, media, posts, profiles } from "@/db/schema";
import { loadBlocks, summaryQuery, toSummary } from "@/lib/data";
import { isDemoMode } from "@/lib/demo/mode";
import * as demo from "@/lib/demo/queries";
import type { Session } from "@/lib/session";
import type {
  AdminRow,
  AuditEntry,
  EditablePost,
  HomepageOption,
  MediaItem,
  Paginated,
  PostStatus,
  PostSummary,
  ProfileStatus,
  ReaderRow,
  Role,
} from "@/lib/types";

/*
 * Staff data layer. Queries run through withRls(session.userId), so RLS applies with the
 * staff member's own identity. The two privileged reads (auth.users) check the role in
 * code first, because RLS cannot see the auth schema.
 */

export const MAX_ACTIVE_ADMINS = 6;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function assertSuperAdmin(session: Session) {
  if (session.role !== "SUPER_ADMIN") throw new Error("Super admin access required.");
}

/** The signed-in admin's own posts, optionally filtered by status, most recently updated first. */
export async function getAdminPosts(session: Session, status?: PostStatus): Promise<PostSummary[]> {
  if (isDemoMode()) return demo.demoAdminPosts(session.userId, status);
  const filters: SQL[] = [eq(posts.authorId, session.userId)];
  if (status) filters.push(eq(posts.status, status));
  const rows = await withRls(session.userId, (tx) =>
    summaryQuery(tx)
      .where(and(...filters))
      .orderBy(desc(posts.updatedAt)),
  );
  return rows.map(toSummary);
}

export async function getAdminCounts(session: Session) {
  if (isDemoMode()) return demo.demoAdminCounts(session.userId);
  return withRls(session.userId, async (tx) => {
    const statusRows = await tx
      .select({ status: posts.status, value: count() })
      .from(posts)
      .where(eq(posts.authorId, session.userId))
      .groupBy(posts.status);
    const [{ value: mediaCount }] = await tx
      .select({ value: count() })
      .from(media)
      .where(and(eq(media.uploaderId, session.userId), isNull(media.deletedAt)));
    const byStatus = Object.fromEntries(statusRows.map((row) => [row.status, row.value]));
    return {
      published: byStatus.PUBLISHED ?? 0,
      drafts: byStatus.DRAFT ?? 0,
      archived: byStatus.ARCHIVED ?? 0,
      media: mediaCount,
    };
  });
}

/** A post the signed-in admin authored, with its blocks, for the editor. */
export async function getEditablePost(session: Session, id: string): Promise<EditablePost | null> {
  if (!isUuid(id)) return null;
  if (isDemoMode()) return demo.demoEditablePost(session.userId, id);
  return withRls(session.userId, async (tx) => {
    const [row] = await tx
      .select()
      .from(posts)
      .where(and(eq(posts.id, id), eq(posts.authorId, session.userId)))
      .limit(1);
    if (!row) return null;
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      dek: row.dek,
      categoryId: row.categoryId,
      coverImageUrl: row.coverImageUrl,
      coverAlt: row.coverAlt,
      readMinutes: row.readMinutes,
      status: row.status as PostStatus,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      updatedAt: row.updatedAt.toISOString(),
      blocks: await loadBlocks(tx, row.id),
    };
  });
}

export async function getMediaForUploader(session: Session): Promise<MediaItem[]> {
  if (isDemoMode()) return demo.demoMediaForUploader(session.userId);
  const rows = await withRls(session.userId, (tx) =>
    tx
      .select()
      .from(media)
      .where(and(eq(media.uploaderId, session.userId), isNull(media.deletedAt)))
      .orderBy(desc(media.createdAt)),
  );
  return rows.map((row) => ({
    id: row.id,
    publicUrl: row.publicUrl,
    storagePath: row.storagePath,
    mime: row.mime,
    sizeBytes: row.sizeBytes,
    altText: row.altText,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function getControlStats(session: Session) {
  assertSuperAdmin(session);
  if (isDemoMode()) return demo.demoControlStats();
  return withRls(session.userId, async (tx) => {
    const adminRows = await tx
      .select({ status: profiles.status, value: count() })
      .from(profiles)
      .where(eq(profiles.role, "ADMIN"))
      .groupBy(profiles.status);
    const [{ value: publishedPosts }] = await tx
      .select({ value: count() })
      .from(posts)
      .where(eq(posts.status, "PUBLISHED"));
    const byStatus = Object.fromEntries(adminRows.map((row) => [row.status, row.value]));
    return {
      activeAdmins: byStatus.ACTIVE ?? 0,
      suspendedAdmins: byStatus.SUSPENDED ?? 0,
      totalAdmins: adminRows.reduce((sum, row) => sum + row.value, 0),
      publishedPosts,
    };
  });
}

/** Every profile with role ADMIN, with published story counts and last sign-in. */
export async function getAdminRows(session: Session): Promise<AdminRow[]> {
  assertSuperAdmin(session);
  if (isDemoMode()) return demo.demoAdminRows();
  const rows = await withRls(session.userId, async (tx) => {
    const adminProfiles = await tx
      .select()
      .from(profiles)
      .where(eq(profiles.role, "ADMIN"))
      .orderBy(profiles.displayName);
    const counts = await tx
      .select({ authorId: posts.authorId, value: count() })
      .from(posts)
      .where(eq(posts.status, "PUBLISHED"))
      .groupBy(posts.authorId);
    const countMap = new Map(counts.map((row) => [row.authorId, row.value]));
    return adminProfiles.map((profile) => ({ profile, storyCount: countMap.get(profile.id) ?? 0 }));
  });

  // Privileged read of auth.users: the caller was verified as SUPER_ADMIN above.
  const ids = rows.map((row) => row.profile.id);
  const signIns = ids.length
    ? await getDb()
        .select({ id: authUsersFull.id, lastSignInAt: authUsersFull.lastSignInAt })
        .from(authUsersFull)
        .where(inArray(authUsersFull.id, ids))
    : [];
  const signInMap = new Map(signIns.map((row) => [row.id, row.lastSignInAt]));

  return rows.map(({ profile, storyCount }) => ({
    id: profile.id,
    username: profile.username,
    displayName: profile.displayName,
    role: profile.role as Role,
    status: profile.status as ProfileStatus,
    storyCount,
    lastSignInAt: signInMap.get(profile.id)?.toISOString() ?? null,
  }));
}

/**
 * Reader accounts: Supabase Auth users without a staff profile. Readers do not sign up
 * in this phase, so this is normally empty. Read-only, paginated.
 */
export async function getReaders(
  session: Session,
  options: { q?: string; page?: number; pageSize?: number },
): Promise<Paginated<ReaderRow>> {
  assertSuperAdmin(session);
  const pageSize = options.pageSize ?? 20;
  const page = Math.max(1, options.page ?? 1);
  // Readers have no accounts in this phase; demo mode has none either.
  if (isDemoMode()) return { items: [], total: 0, page, pageSize };
  const filters: SQL[] = [isNull(profiles.id)];
  const q = options.q?.trim();
  if (q) filters.push(ilike(authUsersFull.email, `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`));
  const where = and(...filters);

  // Privileged read of auth.users: the caller was verified as SUPER_ADMIN above.
  const db = getDb();
  const [{ value: total }] = await db
    .select({ value: count() })
    .from(authUsersFull)
    .leftJoin(profiles, eq(profiles.id, authUsersFull.id))
    .where(where);
  const rows = await db
    .select({
      id: authUsersFull.id,
      email: authUsersFull.email,
      createdAt: authUsersFull.createdAt,
      lastSignInAt: authUsersFull.lastSignInAt,
    })
    .from(authUsersFull)
    .leftJoin(profiles, eq(profiles.id, authUsersFull.id))
    .where(where)
    .orderBy(desc(authUsersFull.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    items: rows.map((row) => ({
      id: row.id,
      email: row.email ?? "",
      createdAt: row.createdAt?.toISOString() ?? null,
      lastSignInAt: row.lastSignInAt?.toISOString() ?? null,
    })),
    total,
    page,
    pageSize,
  };
}

/** Audit log, filtered and paginated in the database, newest first. RLS: SUPER_ADMIN only. */
export async function getAuditEntries(
  session: Session,
  options: { action?: string; page?: number; pageSize?: number },
): Promise<Paginated<AuditEntry>> {
  assertSuperAdmin(session);
  if (isDemoMode()) return demo.demoAuditEntries(options);
  const pageSize = options.pageSize ?? 25;
  const page = Math.max(1, options.page ?? 1);
  const where = options.action ? eq(auditLog.action, options.action) : undefined;

  return withRls(session.userId, async (tx) => {
    const [{ value: total }] = await tx.select({ value: count() }).from(auditLog).where(where);
    const rows = await tx
      .select({
        id: auditLog.id,
        action: auditLog.action,
        targetType: auditLog.targetType,
        targetId: auditLog.targetId,
        metadata: auditLog.metadata,
        createdAt: auditLog.createdAt,
        actorName: profiles.displayName,
      })
      .from(auditLog)
      .leftJoin(profiles, eq(auditLog.actorId, profiles.id))
      .where(where)
      .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize);
    return {
      items: rows.map((row) => ({
        ...row,
        metadata:
          row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
            ? (row.metadata as Record<string, unknown>)
            : {},
        createdAt: row.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    };
  });
}

/** Distinct actions present in the log, for the filter select. */
export async function getAuditActions(session: Session): Promise<string[]> {
  assertSuperAdmin(session);
  if (isDemoMode()) return demo.demoAuditActions();
  const rows = await withRls(session.userId, (tx) =>
    tx.selectDistinct({ action: auditLog.action }).from(auditLog).orderBy(auditLog.action),
  );
  return rows.map((row) => row.action);
}

/**
 * Data for the super admin homepage editor: the current slot assignments (including pins
 * whose story is no longer live, so they can be cleared) and every published story.
 */
export async function getHomepageEditor(session: Session): Promise<{
  assignments: Record<number, string>;
  options: HomepageOption[];
}> {
  assertSuperAdmin(session);
  if (isDemoMode()) {
    return { assignments: demo.demoHomepageAssignments(), options: demo.demoHomepageOptions() };
  }
  return withRls(session.userId, async (tx) => {
    const slots = await tx.select({ slot: homepageSlots.slot, postId: homepageSlots.postId }).from(homepageSlots);
    const options = await tx
      .select({
        id: posts.id,
        title: posts.title,
        publishedAt: posts.publishedAt,
        authorName: profiles.displayName,
      })
      .from(posts)
      .leftJoin(profiles, eq(posts.authorId, profiles.id))
      .where(eq(posts.status, "PUBLISHED"))
      .orderBy(desc(posts.publishedAt))
      .limit(300);
    return {
      assignments: Object.fromEntries(slots.map((row) => [row.slot, row.postId])),
      options: options.map((row) => ({ ...row, publishedAt: row.publishedAt?.toISOString() ?? null })),
    };
  });
}

/** Used by the admin limit checks in server actions. */
export function activeAdminFilter() {
  return and(eq(profiles.role, "ADMIN"), eq(profiles.status, "ACTIVE"));
}
