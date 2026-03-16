import * as cheerio from "cheerio";
import { createHash } from "crypto";

export interface ScrapedNewsItem {
  title: string | null;
  body: string;
  sourceUrl: string;
  imageUrl: string | null;
  publishedAt: string | null;
  externalId: string;
}

function hashId(url: string, body: string): string {
  return createHash("sha256").update(`${url}:${body.slice(0, 200)}`).digest("hex").slice(0, 32);
}

export async function scrapeNewsPage(url: string): Promise<ScrapedNewsItem[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": "CommunityInfoShareBot/1.0" },
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) return [];

  const html = await res.text();
  const $ = cheerio.load(html);

  const selectors = "article, .post, .news-item, .blog-post, .announcement, [class*='card'], [class*='post']";
  let candidates = $(selectors).toArray();

  if (candidates.length === 0) {
    candidates = $("main section, main > div > div").toArray();
  }

  type RawItem = Omit<ScrapedNewsItem, "externalId">;
  const items: RawItem[] = [];

  for (const el of candidates) {
    const $el = $(el);
    const heading = $el.find("h1, h2, h3, h4").first();
    const title = heading.text().trim() || null;

    const bodyParts: string[] = [];
    $el.find("p, li").each((_, p) => {
      const text = $(p).text().trim();
      if (text.length > 10) bodyParts.push(text);
    });
    const body = bodyParts.join("\n").slice(0, 1500);
    if (body.length < 20) continue;

    const imgSrc = $el.find("img[src]").first().attr("src") ?? null;
    const publishedAt = $el.find("time[datetime]").first().attr("datetime") ?? null;

    items.push({ title, body, sourceUrl: url, imageUrl: imgSrc, publishedAt });
  }

  return items
    .slice(0, 20)
    .map((item) => ({
      ...item,
      imageUrl:
        item.imageUrl && !item.imageUrl.startsWith("http")
          ? new URL(item.imageUrl, url).href
          : item.imageUrl,
      externalId: hashId(url, item.body),
    }));
}
