import { chromium } from "playwright";

import { parseEventsFromText } from "@/lib/scraping/dateTimeParser";
import type { ScrapeDryRunResult } from "@/types/scraping";

export async function scrapeWithPlaywright(url: string): Promise<ScrapeDryRunResult> {
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });

    const pageText = await page.evaluate(() => {
      const selectors = "article, li, time, h1, h2, h3, h4, p, main, section";
      const chunks = Array.from(document.querySelectorAll(selectors))
        .map((node) => node.textContent?.trim() ?? "")
        .filter((text) => text.length > 0);

      if (chunks.length > 0) {
        return chunks.join("\n");
      }

      return document.body?.innerText ?? "";
    });

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
  } finally {
    await browser.close();
  }
}
