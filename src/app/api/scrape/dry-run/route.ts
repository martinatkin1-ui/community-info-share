import { NextResponse } from "next/server";

import { logScrapeJob } from "@/lib/scraping/logScrapeJob";
import { scrapeEvents } from "@/lib/scraping/scrapeEvents";
import type { ScrapeRequest } from "@/types/scraping";

export const runtime = "nodejs";

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as ScrapeRequest;
  const targetUrl = body?.url?.trim();

  if (!targetUrl || !isValidHttpUrl(targetUrl)) {
    return NextResponse.json({ error: "A valid http/https URL is required." }, { status: 400 });
  }

  try {
    const result = await scrapeEvents(targetUrl, body.provider);
    // Fire-and-forget audit log — non-fatal if it fails
    void logScrapeJob(result, body.organizationId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Dry run scrape failed.",
      },
      { status: 500 }
    );
  }
}
