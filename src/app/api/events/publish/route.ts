import { NextResponse } from "next/server";

import type { ScrapePublishRequest } from "@/types/scraping";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = (await request.json()) as ScrapePublishRequest;
  const approvedEvents = payload?.approvedEvents ?? [];

  if (!payload?.sourceUrl || approvedEvents.length === 0) {
    return NextResponse.json(
      { error: "sourceUrl and at least one approved event are required." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    status: "queued",
    dryRun: true,
    sourceUrl: payload.sourceUrl,
    organizationId: payload.organizationId ?? null,
    approvedCount: approvedEvents.length,
    message:
      "Dry run approval accepted. Connect this endpoint to Supabase inserts for production publish.",
    preview: approvedEvents.slice(0, 3),
  });
}
