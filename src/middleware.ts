import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/auth";

const VOLUNTEER_COOKIE = "wm-volunteer";
const VOLUNTEER_ALLOWED_PATHS = new Set(["/events", "/referrals", "/organizations", "/volunteer-portal", "/volunteer-signin"]);

/**
 * Runs on every non-static request.
 * Calls updateSession so the Supabase access token stored in the browser
 * cookie is refreshed before any Server Component or Route Handler reads it.
 * Without this, sessions silently expire between page loads.
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isVolunteer = Boolean(request.cookies.get(VOLUNTEER_COOKIE)?.value);
  const hasSupabaseEnv = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  if (isVolunteer) {
    const isManagerArea = pathname.startsWith("/admin") || pathname.startsWith("/dashboard") || pathname.startsWith("/service-status") || pathname.startsWith("/onboarding") || pathname.startsWith("/scrape-");
    if (isManagerArea) {
      return NextResponse.redirect(new URL("/volunteer-portal", request.url));
    }

    const isApi = pathname.startsWith("/api/");
    const allowsMutation = pathname.startsWith("/api/referrals") || pathname.startsWith("/api/volunteer/");
    if (isApi && request.method !== "GET" && !allowsMutation) {
      return NextResponse.json(
        { error: "Volunteer access is read-only for this action." },
        { status: 403 }
      );
    }

    const publicRootAllowed =
      pathname === "/" ||
      Array.from(VOLUNTEER_ALLOWED_PATHS).some((p) => pathname === p || pathname.startsWith(`${p}/`));
    if (!isApi && !publicRootAllowed && !pathname.startsWith("/manager-") && !pathname.startsWith("/client-signin")) {
      return NextResponse.redirect(new URL("/volunteer-portal", request.url));
    }
  }

  if (!hasSupabaseEnv) {
    return NextResponse.next();
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - public asset extensions
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
