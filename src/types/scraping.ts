export type ScraperProvider = "playwright" | "firecrawl" | "auto";

export interface ScrapedEvent {
  tempId: string;
  eventName: string;
  dateText: string;
  timeText: string | null;
  startsAtIso: string | null;
  sourceSnippet: string;
  sourceUrl: string;
  confidence: number;
}

export interface ScrapeDryRunResult {
  provider: Exclude<ScraperProvider, "auto">;
  sourceUrl: string;
  scrapedAtIso: string;
  totalCandidates: number;
  events: ScrapedEvent[];
  warnings: string[];
}

export interface ScrapeRequest {
  url: string;
  /** Optional – links this scrape run to an organisation row for the audit log. */
  organizationId?: string;
  provider?: ScraperProvider;
}

export interface ScrapePublishRequest {
  organizationId?: string;
  sourceUrl: string;
  approvedEvents: ScrapedEvent[];
}
