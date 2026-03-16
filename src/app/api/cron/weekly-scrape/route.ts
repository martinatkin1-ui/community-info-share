import { NextResponse } from "next/server";

import { createServerClient } from "@/lib/supabase/server";
import { scrapeEvents } from "@/lib/scraping/scrapeEvents";
import { scrapeNewsPage } from "@/lib/scraping/scrapeNews";
import { logScrapeJob } from "@/lib/scraping/logScrapeJob";

export const runtime = "nodejs";
export const maxDuration = 300;

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  if (CRON_SECRET) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  const supabase = createServerClient();

  const { data: orgs, error: orgsError } = await supabase
    .from("organizations")
    .select("id, name, scraping_url, news_url")
    .eq("verification_status", "verified");

  if (orgsError) {
    return NextResponse.json({ error: orgsError.message }, { status: 500 });
  }

  const results: Array<{
    org: string;
    eventsFound: number;
    newsFound: number;
    errors: string[];
  }> = [];

  for (const org of orgs ?? []) {
    const entry = { org: org.name, eventsFound: 0, newsFound: 0, errors: [] as string[] };

    if (org.scraping_url) {
      try {
        const scrapeResult = await scrapeEvents(org.scraping_url);
        void logScrapeJob(scrapeResult, org.id);

        const highConfidence = scrapeResult.events.filter((e) => e.confidence >= 0.5);
        if (highConfidence.length > 0) {
          const pubRes = await fetch(new URL("/api/events/publish", request.url).href, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(CRON_SECRET ? { authorization: `Bearer ${CRON_SECRET}` } : {}),
            },
            body: JSON.stringify({
              organizationId: org.id,
              sourceUrl: scrapeResult.sourceUrl,
              approvedEvents: highConfidence,
            }),
          });
          if (pubRes.ok) {
            const pubData = await pubRes.json();
            entry.eventsFound = pubData.approvedCount ?? highConfidence.length;
          }
        }
      } catch (err) {
        entry.errors.push(`events: ${err instanceof Error ? err.message : "failed"}`);
      }
    }

    if (org.news_url) {
      try {
        const newsItems = await scrapeNewsPage(org.news_url);

        for (const item of newsItems) {
          await supabase
            .from("social_posts")
            .upsert(
              {
                organization_id: org.id,
                source: "website",
                source_url: item.sourceUrl,
                external_id: item.externalId,
                title: item.title,
                body: item.body,
                image_url: item.imageUrl,
                published_at: item.publishedAt ?? new Date().toISOString(),
                fetched_at: new Date().toISOString(),
              },
              { onConflict: "external_id" }
            );
        }

        entry.newsFound = newsItems.length;
      } catch (err) {
        entry.errors.push(`news: ${err instanceof Error ? err.message : "failed"}`);
      }
    }

    results.push(entry);
  }

  const totalEvents = results.reduce((sum, r) => sum + r.eventsFound, 0);
  const totalNews = results.reduce((sum, r) => sum + r.newsFound, 0);

  return NextResponse.json({
    status: "completed",
    orgsProcessed: results.length,
    totalEvents,
    totalNews,
    results,
  });
}
