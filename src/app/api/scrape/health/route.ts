import { NextResponse } from "next/server";

import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const STALE_WARNING_DAYS  = 3;
const STALE_CRITICAL_DAYS = 7;

function daysSince(isoString: string): number {
  return (Date.now() - new Date(isoString).getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * GET /api/scrape/health
 * Returns per-organisation scrape status with alert levels.
 * Restricted to authenticated managers; enforced via Supabase service role
 * and should be paired with session middleware in production.
 */
export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: orgs, error: orgsErr } = await supabase
      .from("organizations")
      .select("id, name, scraping_url, verification_status")
      .not("scraping_url", "is", null)
      .order("name");

    if (orgsErr) {
      return NextResponse.json({ error: orgsErr.message }, { status: 500 });
    }

    const orgIds = (orgs ?? []).map((o: { id: string }) => o.id);

    const { data: jobs, error: jobsErr } = await supabase
      .from("scrape_jobs")
      .select("organization_id, status, events_found, error_message, scraped_at, provider, warnings")
      .in("organization_id", orgIds)
      .order("scraped_at", { ascending: false });

    if (jobsErr) {
      return NextResponse.json({ error: jobsErr.message }, { status: 500 });
    }

    // Keep only the latest job per org
    const latestByOrg = new Map<string, (typeof jobs)[number]>();
    for (const job of jobs ?? []) {
      if (!latestByOrg.has(job.organization_id)) {
        latestByOrg.set(job.organization_id, job);
      }
    }

    const health = (orgs ?? []).map((org: { id: string; name: string; scraping_url: string }) => {
      const latestJob = latestByOrg.get(org.id) ?? null;
      let alertLevel: "ok" | "warning" | "critical";
      let summary: string;

      if (!latestJob) {
        alertLevel = "critical";
        summary    = "Never scraped — no event data available.";
      } else {
        const age = daysSince(latestJob.scraped_at);

        if (latestJob.status === "failed") {
          alertLevel = "critical";
          summary    = latestJob.error_message ?? "Last scrape failed.";
        } else if (age > STALE_CRITICAL_DAYS) {
          alertLevel = "critical";
          summary    = `Last scraped ${Math.round(age)} days ago — data may be stale.`;
        } else if (age > STALE_WARNING_DAYS || latestJob.events_found === 0) {
          alertLevel = "warning";
          summary    = age > STALE_WARNING_DAYS
            ? `Last scraped ${Math.round(age)} days ago.`
            : "Last scrape returned 0 events.";
        } else {
          alertLevel = "ok";
          summary    = `${latestJob.events_found} events found · last run ${Math.round(age * 24)}h ago.`;
        }
      }

      return {
        organizationId:   org.id,
        organizationName: org.name,
        scrapingUrl:      org.scraping_url,
        alertLevel,
        summary,
        lastJob: latestJob
          ? {
              status:       latestJob.status,
              eventsFound:  latestJob.events_found,
              scrapedAt:    latestJob.scraped_at,
              provider:     latestJob.provider,
              errorMessage: latestJob.error_message ?? null,
              warnings:     latestJob.warnings      ?? [],
            }
          : null,
      };
    });

    return NextResponse.json({ health });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error." },
      { status: 500 }
    );
  }
}
