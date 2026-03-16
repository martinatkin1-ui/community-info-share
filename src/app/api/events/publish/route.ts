import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

import { canAccessOrganization, requireManagerAccess } from "@/lib/auth/managerAccess";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createServerClient } from "@/lib/supabase/server";
import type { ScrapePublishRequest } from "@/types/scraping";

export const runtime = "nodejs";

function normalizeComparableUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    url.hash = "";
    url.search = "";
    return url.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}

async function inferOrganizationIdFromSourceUrl(sourceUrl: string): Promise<string | undefined> {
  const normalizedSource = normalizeComparableUrl(sourceUrl);
  if (!normalizedSource) return undefined;

  const source = new URL(normalizedSource);
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, scraping_url, website_url, news_url");

  if (error) {
    throw new Error(error.message);
  }

  const candidates = (data ?? []).filter((org) => {
    const possibleUrls = [org.scraping_url, org.website_url, org.news_url]
      .map((value) => (value ? normalizeComparableUrl(value) : null))
      .filter((value): value is string => Boolean(value));

    return possibleUrls.some((candidate) => {
      if (candidate === normalizedSource) return true;

      try {
        const candidateUrl = new URL(candidate);
        return candidateUrl.origin === source.origin && normalizedSource.startsWith(candidate);
      } catch {
        return false;
      }
    });
  });

  if (candidates.length === 1) {
    return candidates[0].id;
  }

  return undefined;
}

export async function POST(request: Request) {
  let access;
  try {
    access = await requireManagerAccess();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as ScrapePublishRequest;
  const { organizationId: requestedOrganizationId, sourceUrl, approvedEvents = [] } = payload ?? {};
  const organizationId =
    requestedOrganizationId ??
    (access.role === "super_admin" && sourceUrl ? await inferOrganizationIdFromSourceUrl(sourceUrl) : undefined) ??
    (access.role !== "super_admin" && access.organizationIds.length === 1 ? access.organizationIds[0] : undefined);

  if (!organizationId || !sourceUrl || approvedEvents.length === 0) {
    return NextResponse.json(
      {
        error:
          access.role === "super_admin"
            ? "Could not determine the organization from the scraped URL. Enter the Organization ID or make sure the organization has a matching scraping or website URL."
            : "organizationId, sourceUrl and at least one approved event are required.",
      },
      { status: 400 }
    );
  }

  if (!canAccessOrganization(access, organizationId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only publish events that have a parseable start date (required DB column).
  const publishable = approvedEvents.filter((e) => !!e.startsAtIso);

  if (publishable.length === 0) {
    return NextResponse.json(
      { error: "No approved events have a parseable start date." },
      { status: 422 }
    );
  }

  const user = await getAuthenticatedUser().catch(() => null);
  const supabase = createServerClient();

  const rows = publishable.map((e) => {
    const hash = createHash("sha256")
      .update(`${organizationId}|${e.eventName.trim().toLowerCase()}|${e.startsAtIso}`)
      .digest("hex");

    return {
    organization_id: organizationId,
    title: e.eventName,
    description: e.sourceSnippet ?? null,
    start_at: e.startsAtIso,
    source_url: e.sourceUrl,
    scraped_event_hash: hash,
    is_scraped: true,
    created_by: user?.id ?? null,
    };
  });

  const hashes = rows.map((row) => row.scraped_event_hash);
  const { data: existing, error: existingError } = await supabase
    .from("events")
    .select("id, scraped_event_hash")
    .eq("organization_id", organizationId)
    .in("scraped_event_hash", hashes);

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const { error: insertError, data: upserted } = await supabase
    .from("events")
    .upsert(rows, { onConflict: "scraped_event_hash", ignoreDuplicates: false })
    .select("id, scraped_event_hash");

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const alreadyPresentCount = existing?.length ?? 0;
  const idempotentNoOp = alreadyPresentCount === rows.length;

  return NextResponse.json({
    status: "published",
    sourceUrl,
    organizationId,
    insertedCount: (upserted?.length ?? rows.length) - alreadyPresentCount,
    alreadyPresentCount,
    idempotentNoOp,
  });
}
