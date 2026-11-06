"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { withRls } from "@/db";
import { DEMO_SESSION_COOKIE, isDemoMode } from "@/lib/demo/mode";
import { demoUpdateProfile } from "@/lib/demo/mutations";
import { profiles } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { profileSchema, type ProfileValues } from "@/lib/auth-schemas";
import { stripTags } from "@/lib/sanitize";
import { requireRole } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ProfileResult = { ok: true; message: string } | { ok: false; error: string };

/** Updates the signed-in staff member's own display name and bio. Role and status are untouchable here. */
export async function updateProfileAction(values: ProfileValues): Promise<ProfileResult> {
  const session = await requireRole("ADMIN", "SUPER_ADMIN");
  if (!session) return { ok: false, error: "You need to be signed in to do that." };

  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  const displayName = stripTags(parsed.data.displayName);
  const bio = stripTags(parsed.data.bio);

  if (isDemoMode()) {
    demoUpdateProfile(session, displayName, bio);
    revalidatePath("/", "layout");
    return { ok: true, message: "Profile saved." };
  }

  await withRls(session.userId, async (tx) => {
    await tx.update(profiles).set({ displayName, bio }).where(eq(profiles.id, session.userId));
    await writeAudit(tx, {
      actorId: session.userId,
      action: "PROFILE_UPDATED",
      targetType: "profile",
      targetId: session.userId,
      metadata: { fields: ["display_name", "bio"] },
    });
  });

  revalidatePath("/", "layout");
  return { ok: true, message: "Profile saved." };
}

/** Ends every session for this account, on all devices. */
export async function signOutEverywhereAction(): Promise<void> {
  const session = await requireRole("ADMIN", "SUPER_ADMIN");
  if (session && isDemoMode()) {
    (await cookies()).delete(DEMO_SESSION_COOKIE);
  } else if (session) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut({ scope: "global" });
  }
  redirect("/login");
}
