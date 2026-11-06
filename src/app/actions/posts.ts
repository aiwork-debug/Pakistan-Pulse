"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { withRls } from "@/db";
import { categories, postBlocks, posts } from "@/db/schema";
import { pgErrorCode, writeAudit } from "@/lib/audit";
import { blockToRow } from "@/lib/blocks";
import { isUuid } from "@/lib/dashboard-data";
import { DEMO_MEDIA_PREFIX, isDemoMode } from "@/lib/demo/mode";
import { demoChangePostStatus, demoSavePost } from "@/lib/demo/mutations";
import {
  postInputSchema,
  validateDraft,
  validateForPublish,
  type BlockInput,
  type FieldErrors,
  type PostInput,
} from "@/lib/post-schemas";
import { stripTags } from "@/lib/sanitize";
import { requireRole } from "@/lib/session";
import { slugify } from "@/lib/slug";
import type { Block, PostStatus } from "@/lib/types";
import { extractYoutubeId } from "@/lib/youtube";

export type SaveIntent = "draft" | "publish" | "autosave";

export type SavePostResult =
  | {
      ok: true;
      id: string;
      slug: string;
      status: PostStatus;
      savedAt: string;
      publishedAt: string | null;
    }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

export type StatusChangeResult = { ok: true; status: PostStatus } | { ok: false; error: string };

const NOT_ALLOWED = "You need to be signed in as an admin to do that.";

class ActionError extends Error {
  constructor(
    message: string,
    readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
  }
}

function zodFieldErrors(issues: { path: (string | number)[]; message: string }[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const key = issue.path.slice(0, 2).join(".") || "form";
    errors[key] ??= issue.message;
  }
  return errors;
}

function storageUrlPrefix(): string | null {
  if (isDemoMode()) return DEMO_MEDIA_PREFIX;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url ? `${url.replace(/\/$/, "")}/storage/v1/object/public/media/` : null;
}

/** Bundled dummy photos in public/demo/, accepted only while the app runs in demo mode. */
const DEMO_SEED_PHOTO_PREFIX = "/demo/";

/** True when an image URL points at the Pulse media library (or a demo photo in demo mode). */
function isOwnMediaUrl(url: string): boolean {
  const prefix = storageUrlPrefix();
  if (prefix && url.startsWith(prefix)) return true;
  return isDemoMode() && url.startsWith(DEMO_SEED_PHOTO_PREFIX) && !url.includes("..");
}

/** Sanitises one block and converts it to the stored shape. Text is always stripped of HTML. */
function toStoredBlock(block: BlockInput, index: number, errors: FieldErrors): Block {
  switch (block.type) {
    case "paragraph":
      return { type: "paragraph", text: stripTags(block.text) };
    case "heading":
      return { type: "heading", text: stripTags(block.text) };
    case "quote":
      return { type: "quote", text: stripTags(block.text), attribution: stripTags(block.attribution) };
    case "image": {
      const url = block.url.trim();
      if (url && !isOwnMediaUrl(url)) {
        errors[`blocks.${index}`] = "Images must be uploaded to the Pulse media library.";
      }
      return { type: "image", url, alt: stripTags(block.alt), caption: stripTags(block.caption) };
    }
    case "youtube":
      // Only the 11-character ID is stored. Invalid input was rejected by validateDraft.
      return { type: "youtube", videoId: extractYoutubeId(block.url) ?? "", title: stripTags(block.title) };
    case "tweet":
      return {
        type: "tweet",
        author: stripTags(block.author),
        handle: stripTags(block.handle),
        text: stripTags(block.text),
      };
    case "video": {
      const poster = block.poster.trim();
      if (poster && !isOwnMediaUrl(poster)) {
        errors[`blocks.${index}`] = "Poster images must come from the Pulse media library.";
      }
      return { type: "video", src: block.src.trim(), poster, title: stripTags(block.title) };
    }
  }
}

/**
 * Creates or updates one of the signed-in admin's stories.
 * - draft: saves with status DRAFT. Only the title has to be valid.
 * - autosave: like draft, but only for posts that are still drafts, so live stories never
 *   change without an explicit action.
 * - publish: validates everything and sets status PUBLISHED. No approval step exists;
 *   the database trigger sets published_at on first publish.
 */
export async function savePostAction(
  id: string | null,
  rawInput: PostInput,
  intent: SaveIntent,
): Promise<SavePostResult> {
  const session = await requireRole("ADMIN", "SUPER_ADMIN");
  if (!session) return { ok: false, error: NOT_ALLOWED };
  if (id !== null && !isUuid(id)) return { ok: false, error: "Story not found." };

  const parsed = postInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }

  const input: PostInput = {
    ...parsed.data,
    title: stripTags(parsed.data.title),
    dek: stripTags(parsed.data.dek),
    slug: parsed.data.slug || slugify(parsed.data.title),
    coverImageUrl: parsed.data.coverImageUrl.trim(),
    coverAlt: stripTags(parsed.data.coverAlt),
  };
  if (!input.slug) input.slug = `story-${crypto.randomUUID().slice(0, 8)}`;

  const fieldErrors = intent === "publish" ? validateForPublish(input) : validateDraft(input);
  if (input.categoryId && !isUuid(input.categoryId)) fieldErrors.categoryId = "Choose a category.";
  if (input.coverImageUrl && !isOwnMediaUrl(input.coverImageUrl)) {
    fieldErrors.coverImageUrl = "The cover image must be uploaded to the Pulse media library.";
  }
  const storedBlocks = input.blocks.map((block, index) => toStoredBlock(block, index, fieldErrors));
  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      error:
        intent === "publish"
          ? "This story is not ready to publish yet. Fix the highlighted fields."
          : "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const status: PostStatus = intent === "publish" ? "PUBLISHED" : "DRAFT";

  if (isDemoMode()) {
    const result = demoSavePost(
      session,
      id,
      {
        slug: input.slug,
        title: input.title,
        dek: input.dek,
        categoryId: input.categoryId || null,
        coverImageUrl: input.coverImageUrl || null,
        coverAlt: input.coverAlt,
        readMinutes: input.readMinutes,
      },
      storedBlocks,
      intent,
    );
    if (result.ok) revalidatePath("/dashboard/posts");
    return result;
  }

  try {
    const saved = await withRls(session.userId, async (tx) => {
      if (input.categoryId) {
        const [category] = await tx
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.id, input.categoryId))
          .limit(1);
        if (!category) throw new ActionError("Choose a category.", { categoryId: "Choose a category." });
      }

      const values = {
        slug: input.slug,
        title: input.title,
        dek: input.dek,
        categoryId: input.categoryId || null,
        coverImageUrl: input.coverImageUrl || null,
        coverAlt: input.coverAlt,
        readMinutes: input.readMinutes,
        status,
      };

      let row: { id: string; slug: string; status: string; publishedAt: Date | null; updatedAt: Date };
      let created = false;

      if (id) {
        const [existing] = await tx
          .select({ id: posts.id, status: posts.status })
          .from(posts)
          .where(and(eq(posts.id, id), eq(posts.authorId, session.userId)))
          .for("update")
          .limit(1);
        if (!existing) throw new ActionError("Story not found.");
        if (intent === "autosave" && existing.status !== "DRAFT") {
          throw new ActionError("Autosave only runs for drafts.");
        }
        [row] = await tx
          .update(posts)
          .set(values)
          .where(eq(posts.id, id))
          .returning({
            id: posts.id,
            slug: posts.slug,
            status: posts.status,
            publishedAt: posts.publishedAt,
            updatedAt: posts.updatedAt,
          });
      } else {
        [row] = await tx
          .insert(posts)
          .values({ ...values, authorId: session.userId })
          .returning({
            id: posts.id,
            slug: posts.slug,
            status: posts.status,
            publishedAt: posts.publishedAt,
            updatedAt: posts.updatedAt,
          });
        created = true;
      }

      // Replace every block in the same transaction, renumbered 0..n-1 with no gaps.
      await tx.delete(postBlocks).where(eq(postBlocks.postId, row.id));
      if (storedBlocks.length > 0) {
        await tx.insert(postBlocks).values(
          storedBlocks.map((block, position) => ({ postId: row.id, position, ...blockToRow(block) })),
        );
      }

      const metadata = { slug: row.slug, status: row.status, blocks: storedBlocks.length, intent };
      if (created) {
        await writeAudit(tx, {
          actorId: session.userId,
          action: "POST_CREATED",
          targetType: "post",
          targetId: row.id,
          metadata,
        });
      }
      if (intent === "publish") {
        await writeAudit(tx, {
          actorId: session.userId,
          action: "POST_PUBLISHED",
          targetType: "post",
          targetId: row.id,
          metadata,
        });
      } else if (!created) {
        await writeAudit(tx, {
          actorId: session.userId,
          action: "POST_UPDATED",
          targetType: "post",
          targetId: row.id,
          metadata,
        });
      }

      return row;
    });

    revalidatePath("/dashboard/posts");
    return {
      ok: true,
      id: saved.id,
      slug: saved.slug,
      status: saved.status as PostStatus,
      savedAt: saved.updatedAt.toISOString(),
      publishedAt: saved.publishedAt?.toISOString() ?? null,
    };
  } catch (error) {
    if (error instanceof ActionError) {
      return { ok: false, error: error.message, fieldErrors: error.fieldErrors };
    }
    const { code, constraint } = pgErrorCode(error);
    if (code === "23505" && constraint?.includes("slug")) {
      return {
        ok: false,
        error: "That slug is already used by another story.",
        fieldErrors: { slug: "This slug is already used by another story. Choose a different one." },
      };
    }
    if (code === "23514") {
      return {
        ok: false,
        error: "Some fields are missing or too long. Check the title, summary, and cover image.",
      };
    }
    console.error("savePostAction failed", error);
    return { ok: false, error: "The story could not be saved. Please try again." };
  }
}

async function changeStatus(
  id: string,
  next: "DRAFT" | "ARCHIVED",
  allowedFrom: PostStatus[],
  action: "POST_UNPUBLISHED" | "POST_ARCHIVED",
): Promise<StatusChangeResult> {
  const session = await requireRole("ADMIN", "SUPER_ADMIN");
  if (!session) return { ok: false, error: NOT_ALLOWED };
  if (!isUuid(id)) return { ok: false, error: "Story not found." };

  if (isDemoMode()) {
    const result = demoChangePostStatus(session, id, next, allowedFrom, action);
    if (result.ok) revalidatePath("/dashboard/posts");
    return result;
  }

  try {
    await withRls(session.userId, async (tx) => {
      const [existing] = await tx
        .select({ id: posts.id, status: posts.status, slug: posts.slug })
        .from(posts)
        .where(and(eq(posts.id, id), eq(posts.authorId, session.userId)))
        .for("update")
        .limit(1);
      if (!existing) throw new ActionError("Story not found.");
      if (!allowedFrom.includes(existing.status as PostStatus)) {
        throw new ActionError(`A ${existing.status.toLowerCase()} story cannot be changed that way.`);
      }
      await tx.update(posts).set({ status: next }).where(eq(posts.id, id));
      await writeAudit(tx, {
        actorId: session.userId,
        action,
        targetType: "post",
        targetId: id,
        metadata: { slug: existing.slug, from: existing.status, to: next },
      });
    });
  } catch (error) {
    if (error instanceof ActionError) return { ok: false, error: error.message };
    console.error(`${action} failed`, error);
    return { ok: false, error: "The story could not be updated. Please try again." };
  }

  revalidatePath("/dashboard/posts");
  return { ok: true, status: next };
}

/** Moves a published (or archived) story back to DRAFT. published_at is kept. */
export async function unpublishPostAction(id: string): Promise<StatusChangeResult> {
  return changeStatus(id, "DRAFT", ["PUBLISHED", "ARCHIVED"], "POST_UNPUBLISHED");
}

/** Hides a story from public pages without deleting it. */
export async function archivePostAction(id: string): Promise<StatusChangeResult> {
  return changeStatus(id, "ARCHIVED", ["DRAFT", "PUBLISHED"], "POST_ARCHIVED");
}
