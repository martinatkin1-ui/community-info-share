import { NextResponse } from "next/server";

import { requireManagerAccess } from "@/lib/auth/managerAccess";
import { runScrapeRoute } from "@/lib/scraping/runScrapeRoute";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireManagerAccess();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg || "Authentication required." }, { status });
  }

  return runScrapeRoute(request);
}
