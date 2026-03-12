import { NextResponse } from "next/server";

import { requireSuperAdminAccess } from "@/lib/auth/adminAccess";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function buildMockPreview(scrapingUrl: string | null) {
  const base = scrapingUrl?.replace(/\/+$/, "") ?? "https://example.org/events";
  return [
    { title: "Wellbeing Drop-in", date: "2026-03-18", sourceUrl: `${base}#dropin` },
    { title: "Housing Advice Session", date: "2026-03-20", sourceUrl: `${base}#housing` },
    { title: "Recovery Peer Circle", date: "2026-03-22", sourceUrl: `${base}#recovery` },
    { title: "Benefits & Debt Workshop", date: "2026-03-25", sourceUrl: `${base}#debt` },
  ];
}

function extractScrapingUrls(
  metadata: { onboarding?: { scrapingUrls?: unknown } } | null,
  scrapingUrl: string | null
): string[] {
  const fromMetadata = metadata?.onboarding?.scrapingUrls;
  if (Array.isArray(fromMetadata)) {
    const cleaned = fromMetadata.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
    if (cleaned.length > 0) return cleaned;
  }
  return scrapingUrl ? [scrapingUrl] : [];
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: orgId } = await context.params;

  try {
    await requireSuperAdminAccess();
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("organizations")
      .select("id, name, description, website_url, scraping_url, email, phone, metadata")
      .eq("id", orgId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Organization not found." }, { status: 404 });
    }

    const socials = data.metadata?.onboarding?.socials ?? {
      facebook: null,
      instagram: null,
      x: null,
    };

    return NextResponse.json({
      organization: {
        id: data.id,
        name: data.name,
        bio: data.description,
        websiteUrl: data.website_url,
        scrapingUrl: data.scraping_url,
        scrapingUrls: extractScrapingUrls(data.metadata, data.scraping_url),
        email: data.email,
        phone: data.phone,
        socials,
      },
      scraperPreview: buildMockPreview(data.scraping_url),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500 }
    );
  }
}
