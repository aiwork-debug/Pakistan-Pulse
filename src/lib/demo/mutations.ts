import "server-only";

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DEMO_MEDIA_PREFIX } from "@/lib/demo/mode";
import {
  DEMO_MEDIA_DIR,
  DEMO_PASSWORD,
  appendDemoAudit,
  getDemoState,
  saveDemoState,
  type DemoPost,
} from "@/lib/demo/store";
import type { FieldErrors } from "@/lib/post-schemas";
import type { Session } from "@/lib/session";
import type { Block, MediaItem, PostStatus } from "@/lib/types";

/*
 * Demo-mode writes. Each one mirrors the matching server action's database path,
 * including the rules the database enforces (unique slugs, published_at, the admin
 * limit, append-only audit entries). Callers have already checked the session and role.
 */

export type DemoSaveResult =
  | { ok: true; id: string; slug: string; status: PostStatus; savedAt: string; publishedAt: string | null }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

export function demoSavePost(
  session: Session,
  id: string | null,
  values: {
    slug: string;
    title: string;
    dek: string;
    categoryId: string | null;
    coverImageUrl: string | null;
    coverAlt: string;
    readMinutes: number;
  },
  blocks: Block[],
  intent: "draft" | "publish" | "autosave",
): DemoSaveResult {
  const state = getDemoState();

  if (values.categoryId && !state.categories.some((category) => category.id === values.categoryId)) {
    return { ok: false, error: "Choose a category.", fieldErrors: { categoryId: "Choose a category." } };
  }
  if (state.posts.some((post) => post.slug === values.slug && post.id !== id)) {
    return {
      ok: false,
      error: "That slug is already used by another story.",
      fieldErrors: { slug: "This slug is already used by another story. Choose a different one." },
    };
  }

  const now = new Date().toISOString();
  const status: PostStatus = intent === "publish" ? "PUBLISHED" : "DRAFT";
  let post: DemoPost;
  let created = false;

  if (id) {
    const existing = state.posts.find((candidate) => candidate.id === id && candidate.authorId === session.userId);
    if (!existing) return { ok: false, error: "Story not found." };
    if (intent === "autosave" && existing.status !== "DRAFT") {
      return { ok: false, error: "Autosave only runs for drafts." };
    }
    Object.assign(existing, values, {
      status,
      blocks,
      updatedAt: now,
      // Same rule as the database trigger: set on first publish, never cleared.
      publishedAt: existing.publishedAt ?? (status === "PUBLISHED" ? now : null),
    });
    post = existing;
  } else {
    post = {
      id: crypto.randomUUID(),
      ...values,
      coverGradient: "teal",
      authorId: session.userId,
      status,
      blocks,
      publishedAt: status === "PUBLISHED" ? now : null,
      createdAt: now,
      updatedAt: now,
    };
    state.posts.push(post);
    created = true;
  }

  const metadata = { slug: post.slug, status: post.status, blocks: blocks.length, intent };
  if (created) {
    appendDemoAudit({ actorId: session.userId, action: "POST_CREATED", targetType: "post", targetId: post.id, metadata });
  }
  if (intent === "publish") {
    appendDemoAudit({ actorId: session.userId, action: "POST_PUBLISHED", targetType: "post", targetId: post.id, metadata });
  } else if (!created) {
    appendDemoAudit({ actorId: session.userId, action: "POST_UPDATED", targetType: "post", targetId: post.id, metadata });
  }
  saveDemoState();

  return { ok: true, id: post.id, slug: post.slug, status: post.status, savedAt: post.updatedAt, publishedAt: post.publishedAt };
}

export function demoChangePostStatus(
  session: Session,
  id: string,
  next: "DRAFT" | "ARCHIVED",
  allowedFrom: PostStatus[],
  action: "POST_UNPUBLISHED" | "POST_ARCHIVED",
): { ok: true; status: PostStatus } | { ok: false; error: string } {
  const post = getDemoState().posts.find((candidate) => candidate.id === id && candidate.authorId === session.userId);
  if (!post) return { ok: false, error: "Story not found." };
  if (!allowedFrom.includes(post.status)) {
    return { ok: false, error: `A ${post.status.toLowerCase()} story cannot be changed that way.` };
  }
  const from = post.status;
  post.status = next;
  post.updatedAt = new Date().toISOString();
  appendDemoAudit({ actorId: session.userId, action, targetType: "post", targetId: id, metadata: { slug: post.slug, from, to: next } });
  saveDemoState();
  return { ok: true, status: next };
}

export function demoUploadMedia(
  session: Session,
  file: { bytes: Uint8Array; mime: string; ext: string; size: number },
  altText: string,
): MediaItem {
  const id = crypto.randomUUID();
  const fileName = `${id}.${file.ext}`;
  mkdirSync(DEMO_MEDIA_DIR, { recursive: true });
  writeFileSync(path.join(DEMO_MEDIA_DIR, fileName), file.bytes);

  const now = new Date();
  const storagePath = `${session.userId}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${fileName}`;
  const item = {
    id,
    uploaderId: session.userId,
    storagePath,
    publicUrl: `${DEMO_MEDIA_PREFIX}${fileName}`,
    mime: file.mime,
    sizeBytes: file.size,
    altText,
    createdAt: now.toISOString(),
    deletedAt: null,
  };
  getDemoState().media.push(item);
  appendDemoAudit({
    actorId: session.userId,
    action: "MEDIA_UPLOADED",
    targetType: "media",
    targetId: id,
    metadata: { storagePath, mime: file.mime, sizeBytes: file.size },
  });
  saveDemoState();
  return {
    id: item.id,
    publicUrl: item.publicUrl,
    storagePath: item.storagePath,
    mime: item.mime,
    sizeBytes: item.sizeBytes,
    altText: item.altText,
    createdAt: item.createdAt,
  };
}

export function demoUpdateMedia(session: Session, id: string, change: { altText?: string; delete?: boolean }): boolean {
  const item = getDemoState().media.find(
    (candidate) => candidate.id === id && candidate.uploaderId === session.userId && !candidate.deletedAt,
  );
  if (!item) return false;
  if (change.delete) {
    item.deletedAt = new Date().toISOString();
    appendDemoAudit({
      actorId: session.userId,
      action: "MEDIA_DELETED",
      targetType: "media",
      targetId: id,
      metadata: { storagePath: item.storagePath, soft: true },
    });
  } else if (change.altText !== undefined) {
    item.altText = change.altText;
    appendDemoAudit({ actorId: session.userId, action: "MEDIA_UPDATED", targetType: "media", targetId: id, metadata: { altText: change.altText } });
  }
  saveDemoState();
  return true;
}

export function demoIsDemoMediaFile(fileName: string): boolean {
  return getDemoState().media.some((item) => item.publicUrl === `${DEMO_MEDIA_PREFIX}${fileName}` && !item.deletedAt);
}

export function demoMediaMime(fileName: string): string | null {
  return getDemoState().media.find((item) => item.publicUrl === `${DEMO_MEDIA_PREFIX}${fileName}`)?.mime ?? null;
}

// ---------------------------------------------------------------------------
// Homepage pins (super admin)
// ---------------------------------------------------------------------------

/**
 * Replaces every homepage pin. `assignments` maps slot number to post id; the caller has
 * validated the slots, uniqueness, and that each post is PUBLISHED.
 */
export function demoSetHomepage(session: Session, assignments: { slot: number; postId: string }[]): void {
  const state = getDemoState();
  const now = new Date().toISOString();
  state.homepage = assignments.map(({ slot, postId }) => ({ slot, postId, updatedBy: session.userId, updatedAt: now }));
  appendDemoAudit({
    actorId: session.userId,
    action: "HOMEPAGE_UPDATED",
    targetType: "homepage",
    targetId: "homepage",
    metadata: {
      pins: assignments.map(({ slot, postId }) => ({
        slot,
        slug: state.posts.find((post) => post.id === postId)?.slug ?? postId,
      })),
    },
  });
  saveDemoState();
}

export function demoPublishedPostIds(ids: string[]): Set<string> {
  return new Set(
    getDemoState()
      .posts.filter((post) => ids.includes(post.id) && post.status === "PUBLISHED")
      .map((post) => post.id),
  );
}

// ---------------------------------------------------------------------------
// Admin management (super admin)
// ---------------------------------------------------------------------------

export type DemoAdminResult = { ok: true; message: string } | { ok: false; error: string; code?: "ADMIN_LIMIT_REACHED" };

function activeAdmins(excludeId?: string): number {
  return getDemoState().profiles.filter(
    (profile) => profile.role === "ADMIN" && profile.status === "ACTIVE" && profile.id !== excludeId,
  ).length;
}

export function demoSetAdminStatus(
  session: Session,
  adminId: string,
  next: "ACTIVE" | "SUSPENDED",
  maxActive: number,
  limitMessage: string,
): DemoAdminResult {
  const admin = getDemoState().profiles.find((profile) => profile.id === adminId && profile.role === "ADMIN");
  if (!admin) return { ok: false, error: "Admin not found." };
  if (next === "SUSPENDED" && admin.status !== "ACTIVE") return { ok: false, error: "Only active admins can be suspended." };
  if (next === "ACTIVE") {
    if (admin.status !== "SUSPENDED") return { ok: false, error: "Only suspended admins can be reactivated." };
    if (activeAdmins(adminId) >= maxActive) return { ok: false, error: limitMessage, code: "ADMIN_LIMIT_REACHED" };
  }
  admin.status = next;
  appendDemoAudit({
    actorId: session.userId,
    action: next === "ACTIVE" ? "ADMIN_REACTIVATED" : "ADMIN_SUSPENDED",
    targetType: "profile",
    targetId: adminId,
    metadata: { username: admin.username },
  });
  saveDemoState();
  return { ok: true, message: next === "ACTIVE" ? "Admin reactivated." : "Admin suspended. They are signed out of the dashboard." };
}

export function demoDeleteAdmin(session: Session, adminId: string, mode: "archive" | "unpublish"): DemoAdminResult & { affected?: number } {
  const state = getDemoState();
  const admin = state.profiles.find((profile) => profile.id === adminId && profile.role === "ADMIN");
  if (!admin) return { ok: false, error: "Admin not found." };
  if (admin.status === "ARCHIVED") return { ok: false, error: "Only active or suspended admins can be deleted." };
  admin.status = "ARCHIVED";

  let affected = 0;
  const now = new Date().toISOString();
  for (const post of state.posts) {
    if (post.authorId !== adminId) continue;
    if (mode === "archive" && post.status !== "ARCHIVED") {
      post.status = "ARCHIVED";
      post.updatedAt = now;
      affected++;
    } else if (mode === "unpublish" && post.status === "PUBLISHED") {
      post.status = "DRAFT";
      post.updatedAt = now;
      affected++;
    }
  }
  appendDemoAudit({
    actorId: session.userId,
    action: "ADMIN_DELETED",
    targetType: "profile",
    targetId: adminId,
    metadata: { username: admin.username, mode, affectedPosts: affected },
  });
  saveDemoState();
  const storyText = `${affected} ${affected === 1 ? "story" : "stories"}`;
  return {
    ok: true,
    affected,
    message: mode === "archive" ? `Admin deleted. ${storyText} archived.` : `Admin deleted. ${storyText} moved to drafts.`,
  };
}

export function demoInviteAdmin(
  session: Session,
  values: { email: string; displayName: string; username: string },
  maxActive: number,
  limitMessage: string,
): DemoAdminResult {
  const state = getDemoState();
  if (activeAdmins() >= maxActive) return { ok: false, error: limitMessage, code: "ADMIN_LIMIT_REACHED" };
  const email = values.email.toLowerCase();
  if (state.profiles.some((profile) => profile.username === values.username || profile.email === email)) {
    return { ok: false, error: "An account with that email or username already exists." };
  }
  const id = crypto.randomUUID();
  state.profiles.push({
    id,
    email,
    username: values.username,
    displayName: values.displayName,
    role: "ADMIN",
    status: "ACTIVE",
    bio: "",
    avatarGradient: "teal",
    createdAt: new Date().toISOString(),
    lastSignInAt: null,
  });
  appendDemoAudit({
    actorId: session.userId,
    action: "ADMIN_CREATED",
    targetType: "profile",
    targetId: id,
    metadata: { username: values.username, via: "demo-invite" },
  });
  saveDemoState();
  return {
    ok: true,
    message: `Demo mode: no email was sent. ${values.email} can sign in now with the demo password ${DEMO_PASSWORD}.`,
  };
}

// ---------------------------------------------------------------------------
// Profile and login
// ---------------------------------------------------------------------------

export function demoUpdateProfile(session: Session, displayName: string, bio: string): void {
  const profile = getDemoState().profiles.find((candidate) => candidate.id === session.userId);
  if (!profile) return;
  profile.displayName = displayName;
  profile.bio = bio;
  appendDemoAudit({
    actorId: session.userId,
    action: "PROFILE_UPDATED",
    targetType: "profile",
    targetId: session.userId,
    metadata: { fields: ["display_name", "bio"] },
  });
  saveDemoState();
}

/** Returns the profile id for valid demo credentials on an ACTIVE account, else null. */
export function demoCheckLogin(email: string, password: string): string | null {
  const profile = getDemoState().profiles.find((candidate) => candidate.email === email.trim().toLowerCase());
  if (!profile || password !== DEMO_PASSWORD || profile.status !== "ACTIVE") return null;
  profile.lastSignInAt = new Date().toISOString();
  saveDemoState();
  return profile.id;
}
