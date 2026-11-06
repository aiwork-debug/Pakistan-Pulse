import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { isDemoMode } from "@/lib/demo/mode";
import { safeNext } from "@/lib/safe-next";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const OTP_TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

/**
 * Landing route for Supabase email links (password reset and admin invites).
 * Supports both the PKCE `code` flow and the `token_hash` flow, then sends the user on to
 * `next` (only same-site paths are accepted).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const next = safeNext(searchParams.get("next"), "/update-password");
  const failure = NextResponse.redirect(new URL("/login?error=link", request.url));
  if (isDemoMode()) return failure;

  const supabase = await createSupabaseServerClient();
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  } else if (tokenHash && type && OTP_TYPES.includes(type as EmailOtpType)) {
    const { error } = await supabase.auth.verifyOtp({ type: type as EmailOtpType, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }

  return failure;
}
