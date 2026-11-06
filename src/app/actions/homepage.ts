"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { withRls } from "@/db";
import { homepageSlots, posts } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { isUuid } from "@/lib/dashboard-data";
import { isDemoMode } from "@/lib/demo/mode";
import { demoPublishedPostIds, demoSetHomepage } from "@/lib/demo/mutations";
import { HOMEPAGE_SLOT_COUNT } from "@/lib/homepage";
import { requireRole } from "@/lib/session";

export type HomepageActionResult = { ok: true; message: string } | { ok: false; error: string };

class NotPublished extends Error {}

/**
 * Saves which stories are pinned to the homepage. `pins[0]` is slot 1 (the hero) and so
 * on; null leaves a slot on automatic (newest story). SUPER_ADMIN only: the session is
 * re-checked here, and the homepage_slots RLS policies enforce the same rule.
 */
export async function saveHomepageAction(pins: (string | null)[]): Promise<HomepageActionResult> {
  const session = await requireRole("SUPER_ADMIN");
  if (!session) return { ok: false, error: "Only a super admin can change the homepage." };

  if (!Array.isArray(pins) || pins.length !== HOMEPAGE_SLOT_COUNT) {
    return { ok: false, error: "Something went wrong. Reload the page and try again." };
  }
  const assignments: { slot: number; postId: string }[] = [];
  for (const [index, value] of pins.entries()) {
    if (value === null || value === "") continue;
    if (typeof value !== "string" || !isUuid(value)) {
      return { ok: false, error: "One of the chosen stories was not found." };
    }
    assignments.push({ slot: index + 1, postId: value });
  }
  const ids = assignments.map((pin) => pin.postId);
  if (new Set(ids).size !== ids.length) {
    return { ok: false, error: "Each story can only be used in one position." };
  }

  const message =
    assignments.length === 0
      ? "Saved. The homepage now shows the newest stories automatically."
      : `Saved. ${assignments.length} ${assignments.length === 1 ? "story is" : "stories are"} pinned to the homepage.`;

  if (isDemoMode()) {
    if (demoPublishedPostIds(ids).size !== ids.length) {
      return { ok: false, error: "Only published stories can be pinned. Reload the page and try again." };
    }
    demoSetHomepage(session, assignments);
    revalidatePath("/");
    revalidatePath("/control/homepage");
    return { ok: true, message };
  }

  try {
    await withRls(session.userId, async (tx) => {
      if (ids.length > 0) {
        const live = await tx
          .select({ id: posts.id, slug: posts.slug })
          .from(posts)
          .where(and(inArray(posts.id, ids), eq(posts.status, "PUBLISHED")));
        if (live.length !== ids.length) throw new NotPublished();
        const slugById = new Map(live.map((row) => [row.id, row.slug]));

        // Replace every pin in one transaction so a story is never in two slots at once.
        await tx.delete(homepageSlots);
        await tx
          .insert(homepageSlots)
          .values(assignments.map((pin) => ({ ...pin, updatedBy: session.userId })));
        await writeAudit(tx, {
          actorId: session.userId,
          action: "HOMEPAGE_UPDATED",
          targetType: "homepage",
          targetId: "homepage",
          metadata: { pins: assignments.map((pin) => ({ slot: pin.slot, slug: slugById.get(pin.postId) })) },
        });
      } else {
        await tx.delete(homepageSlots);
        await writeAudit(tx, {
          actorId: session.userId,
          action: "HOMEPAGE_UPDATED",
          targetType: "homepage",
          targetId: "homepage",
          metadata: { pins: [] },
        });
      }
    });
  } catch (error) {
    if (error instanceof NotPublished) {
      return { ok: false, error: "Only published stories can be pinned. Reload the page and try again." };
    }
    console.error("saveHomepageAction failed", error);
    return { ok: false, error: "The homepage could not be saved. Please try again." };
  }

  revalidatePath("/");
  revalidatePath("/control/homepage");
  return { ok: true, message };
}
