import { NextResponse } from "next/server";

import { createReadOnlyClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: orgId } = await context.params;

  try {
    const supabase = createReadOnlyClient();

    const [orgRes, servicesRes, eventsRes] = await Promise.all([
      supabase
        .from("organizations")
        .select("id, name, description, city, website_url")
        .eq("id", orgId)
        .eq("verification_status", "verified")
        .single(),
      supabase
        .from("services")
        .select("id, title, description, category, eligibility_badge, is_crisis, availability_status")
        .eq("organization_id", orgId)
        .eq("is_active", true)
        .order("is_crisis", { ascending: false })
        .order("title", { ascending: true }),
      supabase
        .from("events")
        .select("id, title, description, start_at, location_name, city")
        .eq("organization_id", orgId)
        .gte("start_at", new Date().toISOString())
        .order("start_at", { ascending: true })
        .limit(20),
    ]);

    if (orgRes.error || !orgRes.data) {
      return NextResponse.json({ error: orgRes.error?.message ?? "Organization not found." }, { status: 404 });
    }
    if (servicesRes.error || eventsRes.error) {
      return NextResponse.json(
        { error: servicesRes.error?.message ?? eventsRes.error?.message ?? "Failed to load wraparound data." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      organization: {
        id: orgRes.data.id,
        name: orgRes.data.name,
        description: orgRes.data.description,
        city: orgRes.data.city,
        websiteUrl: orgRes.data.website_url,
      },
      services: servicesRes.data ?? [],
      events: eventsRes.data ?? [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error." },
      { status: 500 }
    );
  }
}
