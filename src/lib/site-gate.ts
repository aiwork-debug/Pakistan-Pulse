/*
 * Pre-launch password gate. While SITE_PASSWORD is set, every page redirects to /coming-soon
 * until the visitor enters that password. Remove SITE_PASSWORD (and redeploy) to go live.
 *
 * Runs in middleware (Edge runtime), so it uses Web Crypto only, never node:crypto or next/headers.
 */

export const SITE_GATE_COOKIE = "pulse_site_access";
export const COMING_SOON_PATH = "/coming-soon";
/** How long one successful password entry lasts on a device. */
export const SITE_GATE_MAX_AGE = 60 * 60 * 24 * 30;

/** The gate password, or null when the gate is switched off. */
export function sitePassword(): string | null {
  const value = process.env.SITE_PASSWORD?.trim();
  return value ? value : null;
}

/**
 * The cookie value that proves the password was entered: a SHA-256 hash, so the password
 * itself is never stored in the browser. Changing SITE_PASSWORD signs everyone out.
 */
export async function siteAccessToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`pulse-site-gate:v1:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Compares two strings without returning early on the first difference. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** True when the gate is off, or the cookie matches the current password. */
export async function hasSiteAccess(cookieValue: string | undefined): Promise<boolean> {
  const password = sitePassword();
  if (!password) return true;
  if (!cookieValue) return false;
  return safeEqual(cookieValue, await siteAccessToken(password));
}
