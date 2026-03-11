import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/auth";

const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/scrape-dry-run", "/scrape-health", "/service-status"];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  if (!isProtectedPath(request.nextUrl.pathname)) {
    return response;
  }

  const hasAuthCookies = request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-"));
  if (hasAuthCookies) {
    return response;
  }

  const signinUrl = request.nextUrl.clone();
  signinUrl.pathname = "/manager-signin";
  signinUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(signinUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/scrape-dry-run/:path*", "/scrape-health/:path*", "/service-status/:path*"],
};
