import { NextResponse, type NextRequest } from "next/server";
import { COMING_SOON_PATH, SITE_GATE_COOKIE, hasSiteAccess } from "@/lib/site-gate";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const allowed = await hasSiteAccess(request.cookies.get(SITE_GATE_COOKIE)?.value);
  const onComingSoon = pathname === COMING_SOON_PATH;

  // Pre-launch gate: without the password, every page sends visitors to the coming soon page.
  if (!allowed && !onComingSoon) {
    const url = request.nextUrl.clone();
    url.pathname = COMING_SOON_PATH;
    url.search = "";
    if (pathname !== "/") url.searchParams.set("next", `${pathname}${search}`);
    const response = NextResponse.redirect(url);
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  // Team members who already have access skip the coming soon page.
  if (allowed && onComingSoon) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const response = await updateSession(request);
  if (onComingSoon) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: [
    // Every path except static files and images.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
