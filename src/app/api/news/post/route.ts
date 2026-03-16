import { NextResponse } from "next/server";
import { z } from "zod";

import { requireManagerAccess } from "@/lib/auth/managerAccess";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const bodySchema = z.object({
  organizationId: z.string().uuid(),
  title: z.string().max(200).optional(),
  body: z.string().min(1).max(2000),
  imageUrl: z.string().url().optional(),
  source: z.enum(["manual", "facebook", "instagram", "x", "rss", "website"]).default("manual"),
  sourceUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
  try {
    const access = await requireManagerAccess();

    let parsed: z.infer<typeof bodySchema>;
    try {
      parsed = bodySchema.parse(await request.json());
    } catch (err) {
      const msg = err instanceof z.ZodError ? err.issues[0]?.message : "Invalid request.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    if (access.role !== "super_admin" && !access.organizationIds.includes(parsed.organizationId)) {
      return NextResponse.json({ error: "You can only post updates for your own organisation." }, { status: 403 });
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("social_posts")
      .insert({
        organization_id: parsed.organizationId,
        source: parsed.source,
        source_url: parsed.sourceUrl ?? null,
        title: parsed.title ?? null,
        body: parsed.body,
        image_url: parsed.imageUrl ?? null,
        published_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, status: "published" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error.";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
