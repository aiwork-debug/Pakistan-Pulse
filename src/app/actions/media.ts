"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { withRls } from "@/db";
import { media } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { isUuid } from "@/lib/dashboard-data";
import { isDemoMode } from "@/lib/demo/mode";
import { demoUpdateMedia, demoUploadMedia } from "@/lib/demo/mutations";
import { stripTags } from "@/lib/sanitize";
import { requireRole } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MediaItem } from "@/lib/types";

export type UploadResult = { ok: true; item: MediaItem } | { ok: false; error: string };
export type MediaResult = { ok: true } | { ok: false; error: string };

const BUCKET = "media";
const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED: Record<string, { ext: string; matches: (bytes: Uint8Array) => boolean }> = {
  "image/jpeg": { ext: "jpg", matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": {
    ext: "png",
    matches: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  "image/gif": { ext: "gif", matches: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 },
  "image/webp": {
    ext: "webp",
    matches: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
};

const NOT_ALLOWED = "You need to be signed in as an admin to do that.";

/**
 * Uploads an image to the public `media` bucket at {uid}/{yyyy}/{mm}/{uuid}.{ext}.
 * The declared MIME type, the file's magic bytes, and the size are all checked here on the
 * server. The upload uses the admin's own session, so storage RLS applies too.
 */
export async function uploadMediaAction(formData: FormData): Promise<UploadResult> {
  const session = await requireRole("ADMIN", "SUPER_ADMIN");
  if (!session) return { ok: false, error: NOT_ALLOWED };

  const file = formData.get("file");
  const altRaw = formData.get("altText");
  const altText = typeof altRaw === "string" ? stripTags(altRaw).slice(0, 300) : "";

  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose an image to upload." };
  if (file.size > MAX_BYTES) return { ok: false, error: "Images must be 5 MB or smaller." };

  const allowed = ALLOWED[file.type];
  if (!allowed) return { ok: false, error: "Upload a JPEG, PNG, WebP, or GIF image." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!allowed.matches(bytes)) {
    return { ok: false, error: "The file contents do not match its image type." };
  }

  if (isDemoMode()) {
    const item = demoUploadMedia(session, { bytes, mime: file.type, ext: allowed.ext, size: file.size }, altText);
    revalidatePath("/dashboard/media");
    return { ok: true, item };
  }

  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const storagePath = `${session.userId}/${yyyy}/${mm}/${crypto.randomUUID()}.${allowed.ext}`;

  const supabase = await createSupabaseServerClient();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, bytes, { contentType: file.type, upsert: false });
  if (uploadError) {
    console.error("Storage upload failed", uploadError);
    return { ok: false, error: "The image could not be uploaded. Please try again." };
  }
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  try {
    const row = await withRls(session.userId, async (tx) => {
      const [inserted] = await tx
        .insert(media)
        .values({
          uploaderId: session.userId,
          storagePath,
          publicUrl: urlData.publicUrl,
          mime: file.type,
          sizeBytes: file.size,
          altText,
        })
        .returning();
      await writeAudit(tx, {
        actorId: session.userId,
        action: "MEDIA_UPLOADED",
        targetType: "media",
        targetId: inserted.id,
        metadata: { storagePath, mime: file.type, sizeBytes: file.size },
      });
      return inserted;
    });

    revalidatePath("/dashboard/media");
    return {
      ok: true,
      item: {
        id: row.id,
        publicUrl: row.publicUrl,
        storagePath: row.storagePath,
        mime: row.mime,
        sizeBytes: row.sizeBytes,
        altText: row.altText,
        createdAt: row.createdAt.toISOString(),
      },
    };
  } catch (error) {
    // Keep storage and the media table consistent.
    await supabase.storage.from(BUCKET).remove([storagePath]);
    console.error("Media row insert failed", error);
    return { ok: false, error: "The image could not be saved. Please try again." };
  }
}

export async function updateMediaAltAction(id: string, altText: string): Promise<MediaResult> {
  const session = await requireRole("ADMIN", "SUPER_ADMIN");
  if (!session) return { ok: false, error: NOT_ALLOWED };
  if (!isUuid(id)) return { ok: false, error: "File not found." };
  const clean = stripTags(altText).slice(0, 300);

  const updated = isDemoMode()
    ? demoUpdateMedia(session, id, { altText: clean })
    : await withRls(session.userId, async (tx) => {
    const rows = await tx
      .update(media)
      .set({ altText: clean })
      .where(and(eq(media.id, id), eq(media.uploaderId, session.userId), isNull(media.deletedAt)))
      .returning({ id: media.id });
    if (rows.length === 0) return false;
    await writeAudit(tx, {
      actorId: session.userId,
      action: "MEDIA_UPDATED",
      targetType: "media",
      targetId: id,
      metadata: { altText: clean },
    });
    return true;
  });

  if (!updated) return { ok: false, error: "File not found." };
  revalidatePath("/dashboard/media");
  return { ok: true };
}

/** Soft delete: the row is marked deleted and hidden; the file stays for the audit trail. */
export async function deleteMediaAction(id: string): Promise<MediaResult> {
  const session = await requireRole("ADMIN", "SUPER_ADMIN");
  if (!session) return { ok: false, error: NOT_ALLOWED };
  if (!isUuid(id)) return { ok: false, error: "File not found." };

  const deleted = isDemoMode()
    ? demoUpdateMedia(session, id, { delete: true })
    : await withRls(session.userId, async (tx) => {
    const rows = await tx
      .update(media)
      .set({ deletedAt: new Date() })
      .where(and(eq(media.id, id), eq(media.uploaderId, session.userId), isNull(media.deletedAt)))
      .returning({ id: media.id, storagePath: media.storagePath });
    if (rows.length === 0) return false;
    await writeAudit(tx, {
      actorId: session.userId,
      action: "MEDIA_DELETED",
      targetType: "media",
      targetId: id,
      metadata: { storagePath: rows[0].storagePath, soft: true },
    });
    return true;
  });

  if (!deleted) return { ok: false, error: "File not found." };
  revalidatePath("/dashboard/media");
  return { ok: true };
}
