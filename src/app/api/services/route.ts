import { NextResponse } from "next/server";

import { createReadOnlyClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/services
 * Query params:
 *   city  - optional city filter (default Wolverhampton)
 *   need  - optional need tag (e.g. debt, housing)
 *   q     - optional text search
 *   limit - max rows (default 80)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") ?? "Wolverhampton";
  const need = searchParams.get("need")?.trim() ?? "";
  const q = searchParams.get("q")?.trim() ?? "";
  const crisisOnly = searchParams.get("crisis") === "1";
  const openNowOnly = searchParams.get("openNow") === "1";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "80", 10), 150);

  try {
    const supabase = createReadOnlyClient();

    let query = supabase
      .from("services")
      .select(`
        id,
        title,
        description,
        category,
        need_tags,
        eligibility_badge,
        is_crisis,
        availability_status,
        referral_method,
        contact_email,
        organization_id,
        organizations ( id, name, city )
      `)
      .eq("is_active", true)
      .order("is_crisis", { ascending: false })
      .limit(limit);

    // City filtering against joined organizations can be brittle across PostgREST
    // versions, so we return all active services and rely on onboarding defaults
    // (Wolverhampton) until org-level city filters are added to a dedicated view.
    void city;

    if (need) {
      query = query.contains("need_tags", [need]);
    }

    if (crisisOnly) {
      query = query.eq("is_crisis", true);
    }

    if (openNowOnly) {
      query = query.eq("availability_status", "open");
    }

    if (q) {
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const services = (data ?? []).map((row: any) => ({
      id: row.id,
      organizationId: row.organization_id,
      organizationName: row.organizations?.name ?? "Unknown",
      title: row.title,
      description: row.description,
      category: row.category,
      needTags: row.need_tags ?? [],
      eligibilityBadge: row.eligibility_badge ?? null,
      isCrisis: row.is_crisis ?? false,
      availabilityStatus: row.availability_status ?? "open",
      referralMethod: row.referral_method,
      contactEmail: row.contact_email ?? null,
      contactPhone: null,
    }));
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return NextResponse.json({ services });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error." },
      { status: 500 }
    );
  }
}
