import { parseEventsFromText } from "@/lib/scraping/dateTimeParser";
import type { ScrapeDryRunResult } from "@/types/scraping";

interface FirecrawlResponse {
  success?: boolean;
  error?: string;
  data?: {
    markdown?: string;
    content?: string;
    metadata?: Record<string, unknown>;
  };
}

export async function scrapeWithFirecrawl(url: string): Promise<ScrapeDryRunResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  const baseUrl = process.env.FIRECRAWL_API_URL ?? "https://api.firecrawl.dev";

  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY is not configured.");
  }

  // 30-second wall-clock timeout prevents the route hanging on slow providers.
  const response = await fetch(`${baseUrl}/v1/scrape`, {
    signal: AbortSignal.timeout(30_000),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Firecrawl request failed (${response.status}).`);
  }

  const payload = (await response.json()) as FirecrawlResponse;

  if (payload.success === false) {
    throw new Error(payload.error ?? "Firecrawl scrape failed.");
  }

  const text = payload.data?.markdown ?? payload.data?.content ?? "";
  const events = parseEventsFromText(text, url);
  const warnings: string[] = [];

  if (events.length === 0) {
    warnings.push("Firecrawl returned content, but no date/time event patterns were detected.");
  }

  return {
    provider: "firecrawl",
    sourceUrl: url,
    scrapedAtIso: new Date().toISOString(),
    totalCandidates: events.length,
    events,
    warnings,
  };
}
