import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "./env";

// Refreshes the Supabase session cookie on every request and guards /dashboard/* routes.
// Mirrors the Supabase SSR middleware pattern, adapted to Next 16's proxy convention.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const { url: supabaseUrl, anonKey } = supabaseEnv();
  const supabase = createServerClient(
    supabaseUrl,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() revalidates the token and triggers the cookie refresh above.
  // Do not run code between createServerClient and getUser, or sessions can randomly drop.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const redirectResponse = NextResponse.redirect(url);
    // Carry over any cookies the session refresh wrote onto `response`.
    response.cookies.getAll().forEach((cookie) =>
      redirectResponse.cookies.set(cookie)
    );
    return redirectResponse;
  }

  return response;
}
