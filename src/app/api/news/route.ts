import { NextResponse } from "next/server";

import { createReadOnlyClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 30, 100);
  const before = searchParams.get("before");

  try {
    const supabase = createReadOnlyClient();

    let query = supabase
      .from("social_posts")
      .select(`
        id,
        source,
        source_url,
        title,
        body,
        image_url,
        published_at,
        organization_id,
        organizations!inner ( id, name, verification_status )
      `)
      .eq("organizations.verification_status", "verified")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt("published_at", before);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const posts = (data ?? []).map((row: Record<string, unknown>) => {
      const org = row.organizations as { id: string; name: string } | null;
      return {
        id: row.id,
        source: row.source,
        sourceUrl: row.source_url,
        title: row.title,
        body: row.body,
        imageUrl: row.image_url,
        publishedAt: row.published_at,
        organization: org ? { id: org.id, name: org.name } : null,
      };
    });

    return NextResponse.json({ posts });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error." },
      { status: 500 }
    );
  }
}
