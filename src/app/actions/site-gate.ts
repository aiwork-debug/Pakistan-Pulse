"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { safeNext } from "@/lib/safe-next";
import { SITE_GATE_COOKIE, SITE_GATE_MAX_AGE, safeEqual, siteAccessToken, sitePassword } from "@/lib/site-gate";

export type SiteGateState = { error: string | null };

/** Checks the pre-launch password and, when it matches, remembers this device for 30 days. */
export async function unlockSiteAction(_previous: SiteGateState, formData: FormData): Promise<SiteGateState> {
  const password = sitePassword();
  const next = safeNext(formData.get("next"), "/");

  // Gate switched off: nothing to unlock.
  if (!password) redirect(next);

  const entered = formData.get("password");
  const candidate = typeof entered === "string" ? entered.trim() : "";
  const expected = await siteAccessToken(password);
  const given = await siteAccessToken(candidate);

  if (!candidate || !safeEqual(given, expected)) {
    // Slows down repeated guessing a little.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { error: "That password is not correct." };
  }

  const store = await cookies();
  store.set(SITE_GATE_COOKIE, expected, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SITE_GATE_MAX_AGE,
  });
  redirect(next);
}
