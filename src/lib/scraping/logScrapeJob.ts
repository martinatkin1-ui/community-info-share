import { createServerClient } from "@/lib/supabase/server";
import type { ScrapeDryRunResult } from "@/types/scraping";

/**
 * Writes a scrape run outcome to the scrape_jobs audit table.
 * Always non-fatal — a logging failure must never crash the scrape pipeline.
 */
export async function logScrapeJob(
  result: ScrapeDryRunResult,
  organizationId?: string
): Promise<void> {
  try {
    const supabase = createServerClient();

    const status =
      result.totalCandidates > 0
        ? result.warnings.length > 0
          ? "partial"
          : "success"
        : "failed";

    await supabase.from("scrape_jobs").insert({
      organization_id: organizationId ?? null,
      scraping_url:    result.sourceUrl,
      provider:        result.provider,
      status,
      events_found:    result.totalCandidates,
      error_message:
        status === "failed" ? (result.warnings[0] ?? "No events found.") : null,
      warnings: result.warnings,
    });
  } catch (logErr) {
    console.warn("[logScrapeJob] Failed to log scrape job:", logErr);
  }
}
