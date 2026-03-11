import { NextResponse } from "next/server";

import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/events
 * Query params:
 *   city      – filter by city (default "Wolverhampton")
 *   category  – comma-separated eligibility tags to match
 *   q         – free-text search on title / description
 *   limit     – max results (default 40, max 100)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") ?? "Wolverhampton";
  const categoryParam = searchParams.get("category") ?? "";
  const q = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "40", 10), 100);

  try {
    const supabase = createServerClient();

    let query = supabase
      .from("events")
      .select(`
        id,
        title,
        description,
        start_at,
        end_at,
        location_name,
        city,
        postcode,
        eligibility_tags,
        is_scraped,
        source_url,
        organizations ( id, name )
      `)
      .gte("start_at", new Date().toISOString())
      .ilike("city", `%${city}%`)
      .order("start_at", { ascending: true })
      .limit(limit);

    if (q) {
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    }

    if (categoryParam) {
      const tags = categoryParam.split(",").map((t) => t.trim()).filter(Boolean);
      if (tags.length > 0) {
        query = query.overlaps("eligibility_tags", tags);
      }
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const events = (data ?? []).map((row: any) => ({
      id: row.id,
      title: row.title,
      organizationName: row.organizations?.name ?? "Unknown",
      organizationId: row.organizations?.id ?? "",
      startAtIso: row.start_at,
      endAtIso: row.end_at ?? null,
      locationName: row.location_name ?? null,
      city: row.city ?? null,
      postcode: row.postcode ?? null,
      description: row.description ?? null,
      imageUrl: null, // populated when flier attachments are added
      categories: row.eligibility_tags ?? [],
      isScraped: row.is_scraped ?? false,
    }));
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return NextResponse.json({ events });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error." },
      { status: 500 }
    );
  }
}
