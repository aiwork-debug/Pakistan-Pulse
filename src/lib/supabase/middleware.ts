import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

/** Refreshes the Supabase auth cookie on every request. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Without configuration there is no session to refresh. Pages report the missing settings.
  if (!hasSupabasePublicEnv()) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Do not add code between client creation and getUser(): it refreshes the token.
  await supabase.auth.getUser();

  return response;
}
