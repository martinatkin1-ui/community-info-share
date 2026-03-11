import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/auth";

/**
 * Runs on every non-static request.
 * Calls updateSession so the Supabase access token stored in the browser
 * cookie is refreshed before any Server Component or Route Handler reads it.
 * Without this, sessions silently expire between page loads.
 */
export async function middleware(request: NextRequest) {
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
