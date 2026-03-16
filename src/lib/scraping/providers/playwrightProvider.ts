import * as cheerio from "cheerio";

import { parseEventsFromText } from "@/lib/scraping/dateTimeParser";
import type { ScrapeDryRunResult } from "@/types/scraping";

/**
 * Lightweight HTML scraper using fetch + cheerio.
 * Replaces the original Playwright-based implementation so the provider
 * works in serverless environments (Vercel) where browser binaries are unavailable.
 * The name "playwrightProvider" is kept for backwards compatibility with the
 * provider selection logic in scrapeEvents.ts.
 */
export async function scrapeWithPlaywright(url: string): Promise<ScrapeDryRunResult> {
  const res = await fetch(url, {
    headers: { "User-Agent": "CommunityInfoShareBot/1.0" },
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    return {
      provider: "playwright",
      sourceUrl: url,
      scrapedAtIso: new Date().toISOString(),
      totalCandidates: 0,
      events: [],
      warnings: [`HTTP ${res.status} fetching ${url}`],
    };
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const selectors = "article, li, time, h1, h2, h3, h4, p, main, section";
  const chunks = $(selectors)
    .toArray()
    .map((el) => $(el).text().trim())
    .filter((text) => text.length > 0);

  const pageText = chunks.length > 0 ? chunks.join("\n") : $("body").text() ?? "";

  const events = parseEventsFromText(pageText, url);
  const warnings: string[] = [];

  if (events.length === 0) {
    warnings.push(
      "No high-confidence events found. Try Firecrawl provider or verify the page contains visible event content."
    );
  }

  return {
    provider: "playwright",
    sourceUrl: url,
    scrapedAtIso: new Date().toISOString(),
    totalCandidates: events.length,
    events,
    warnings,
  };
}
