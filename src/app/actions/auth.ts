"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { withRls } from "@/db";
import { profiles } from "@/db/schema";
import {
  forgotPasswordSchema,
  loginSchema,
  updatePasswordSchema,
  type ForgotPasswordValues,
  type LoginValues,
  type UpdatePasswordValues,
} from "@/lib/auth-schemas";
import { dashboardHrefFor } from "@/lib/can";
import { DEMO_SESSION_COOKIE, isDemoMode } from "@/lib/demo/mode";
import { demoCheckLogin } from "@/lib/demo/mutations";
import { absoluteUrl } from "@/lib/format";
import { safeNext } from "@/lib/safe-next";
import { getSession } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

const GENERIC_LOGIN_ERROR = "Email or password is incorrect.";
const RESET_MESSAGE = "If an account exists for that email, we've sent a link.";

export async function loginAction(values: LoginValues & { next?: string }): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: GENERIC_LOGIN_ERROR };

  if (isDemoMode()) {
    const profileId = demoCheckLogin(parsed.data.email, parsed.data.password);
    if (!profileId) return { ok: false, error: GENERIC_LOGIN_ERROR };
    (await cookies()).set(DEMO_SESSION_COOKIE, profileId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
    redirect(safeNext(values.next, "/"));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error || !data.user) return { ok: false, error: GENERIC_LOGIN_ERROR };

  // Accounts without an active staff profile (suspended, archived, or not staff) cannot sign in.
  // The same generic message is used, so nothing about the account is revealed.
  const userId = data.user.id;
  const [profile] = await withRls(userId, (tx) =>
    tx.select({ status: profiles.status }).from(profiles).where(eq(profiles.id, userId)).limit(1),
  );
  if (!profile || profile.status !== "ACTIVE") {
    await supabase.auth.signOut();
    return { ok: false, error: GENERIC_LOGIN_ERROR };
  }

  redirect(safeNext(values.next, "/"));
}

export async function logoutAction(): Promise<void> {
  if (isDemoMode()) {
    (await cookies()).delete(DEMO_SESSION_COOKIE);
  } else {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function forgotPasswordAction(values: ForgotPasswordValues): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(values);
  if (parsed.success && !isDemoMode()) {
    const supabase = await createSupabaseServerClient();
    // Errors are ignored on purpose: the answer is identical whether or not the account exists.
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: absoluteUrl("/auth/confirm?next=/update-password"),
    });
  }
  return { ok: true, message: RESET_MESSAGE };
}

/** Sets a new password for the account signed in through a recovery or invite link. */
export async function updatePasswordAction(values: UpdatePasswordValues): Promise<ActionResult> {
  const parsed = updatePasswordSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  if (isDemoMode()) {
    return { ok: false, error: "Passwords cannot be changed in demo mode. Every demo account uses demo1234." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your reset link has expired. Request a new one." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: "The password could not be updated. Try a different password." };

  const session = await getSession();
  redirect(session ? dashboardHrefFor(session.role) : "/login");
}
