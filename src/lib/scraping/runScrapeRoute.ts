import { NextResponse } from "next/server";
import { z } from "zod";

import { logScrapeJob } from "@/lib/scraping/logScrapeJob";
import { scrapeEvents } from "@/lib/scraping/scrapeEvents";
import type { ScrapeDryRunResult, ScrapeRequest } from "@/types/scraping";

const scrapeRequestSchema = z.object({
  url: z
    .string()
    .url()
    .refine((value) => value.startsWith("http://") || value.startsWith("https://"), {
      message: "A valid http/https URL is required.",
    }),
  organizationId: z.string().uuid().optional(),
  provider: z.enum(["playwright", "firecrawl", "auto"]).optional(),
});

export async function runScrapeRoute(request: Request) {
  const parsed = scrapeRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid scrape request." },
      { status: 400 }
    );
  }

  const body = parsed.data as ScrapeRequest;
  const targetUrl = body.url.trim();

  try {
    const result = await scrapeEvents(targetUrl, body.provider);
    void logScrapeJob(result, body.organizationId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dry run scrape failed.";
    const failedResult: ScrapeDryRunResult = {
      provider: body.provider === "firecrawl" ? "firecrawl" : "playwright",
      sourceUrl: targetUrl,
      scrapedAtIso: new Date().toISOString(),
      totalCandidates: 0,
      events: [],
      warnings: [message],
    };

    // Even provider 500/timeout paths must be logged for health monitoring.
    void logScrapeJob(failedResult, body.organizationId);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
