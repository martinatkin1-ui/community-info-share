import { scrapeWithFirecrawl } from "@/lib/scraping/providers/firecrawlProvider";
import { scrapeWithPlaywright } from "@/lib/scraping/providers/playwrightProvider";
import type { ScrapeDryRunResult, ScraperProvider } from "@/types/scraping";

function normalizedProvider(provider?: ScraperProvider): ScraperProvider {
  if (!provider) {
    return (process.env.SCRAPER_DEFAULT_PROVIDER as ScraperProvider | undefined) ?? "auto";
  }

  return provider;
}

export async function scrapeEvents(url: string, provider?: ScraperProvider): Promise<ScrapeDryRunResult> {
  const selectedProvider = normalizedProvider(provider);

  if (selectedProvider === "playwright") {
    return scrapeWithPlaywright(url);
  }

  if (selectedProvider === "firecrawl") {
    return scrapeWithFirecrawl(url);
  }

  try {
    if (process.env.FIRECRAWL_API_KEY) {
      return await scrapeWithFirecrawl(url);
    }

    return await scrapeWithPlaywright(url);
  } catch (primaryError) {
    try {
      const fallback = await scrapeWithPlaywright(url);
      fallback.warnings.unshift(
        `Primary provider failed and fallback was used: ${
          primaryError instanceof Error ? primaryError.message : "Unknown error"
        }`
      );
      return fallback;
    } catch {
      throw primaryError;
    }
  }
}
