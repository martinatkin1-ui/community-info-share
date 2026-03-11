import { NextResponse } from "next/server";

import { requireSuperAdminAccess } from "@/lib/auth/adminAccess";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface ScrapeJobLite {
  organization_id: string | null;
  status: "success" | "partial" | "failed";
  scraped_at: string;
}

export async function GET() {
  try {
    await requireSuperAdminAccess();
    const supabase = createServerClient();

    const [verifiedCountRes, pendingCountRes, scrapeJobsRes, pendingQueueRes] = await Promise.all([
      supabase
        .from("organizations")
        .select("id", { count: "exact", head: true })
        .eq("verification_status", "verified"),
      supabase
        .from("organizations")
        .select("id", { count: "exact", head: true })
        .eq("verification_status", "pending"),
      supabase
        .from("scrape_jobs")
        .select("organization_id, status, scraped_at")
        .order("scraped_at", { ascending: false }),
      supabase
        .from("organizations")
        .select("id, name, website_url, metadata, verification_status")
        .eq("verification_status", "pending")
        .order("created_at", { ascending: true }),
    ]);

    if (verifiedCountRes.error || pendingCountRes.error || scrapeJobsRes.error || pendingQueueRes.error) {
      return NextResponse.json(
        {
          error:
            verifiedCountRes.error?.message ||
            pendingCountRes.error?.message ||
            scrapeJobsRes.error?.message ||
            pendingQueueRes.error?.message ||
            "Failed to load admin dashboard data.",
        },
        { status: 500 }
      );
    }

    const jobs = (scrapeJobsRes.data ?? []) as ScrapeJobLite[];

    // Latest run per organization
    const latestByOrg = new Map<string, ScrapeJobLite>();
    for (const job of jobs) {
      if (!job.organization_id) continue;
      if (!latestByOrg.has(job.organization_id)) {
        latestByOrg.set(job.organization_id, job);
      }
    }

    const totalLatest = latestByOrg.size;
    const successLatest = Array.from(latestByOrg.values()).filter((j) => j.status === "success").length;
    const scraperHealthPct = totalLatest === 0 ? 0 : Math.round((successLatest / totalLatest) * 100);

    const pendingOrganizations = (pendingQueueRes.data ?? []).map((row: {
      id: string;
      name: string;
      website_url: string | null;
      metadata: { onboarding?: { orgType?: string } } | null;
    }) => ({
      id: row.id,
      name: row.name,
      type: row.metadata?.onboarding?.orgType ?? "Other",
      websiteUrl: row.website_url,
    }));

    return NextResponse.json({
      stats: {
        totalActiveOrgs: verifiedCountRes.count ?? 0,
        pendingVerifications: pendingCountRes.count ?? 0,
        scraperHealthPct,
      },
      pendingOrganizations,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500 }
    );
  }
}
