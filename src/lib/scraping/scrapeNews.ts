import { chromium } from "playwright";
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
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });

    type RawItem = Omit<ScrapedNewsItem, "externalId">;

    const items: RawItem[] = await page.evaluate((sourceUrl) => {
      const results: Array<{
        title: string | null;
        body: string;
        imageUrl: string | null;
        publishedAt: string | null;
      }> = [];

      const articleEls = document.querySelectorAll("article, .post, .news-item, .blog-post, .announcement, [class*='card'], [class*='post']");

      const candidates = articleEls.length > 0
        ? articleEls
        : document.querySelectorAll("main section, main > div > div");

      candidates.forEach((el) => {
        const heading = el.querySelector("h1, h2, h3, h4");
        const title = heading?.textContent?.trim() ?? null;
        const bodyParts: string[] = [];
        el.querySelectorAll("p, li").forEach((p) => {
          const text = p.textContent?.trim();
          if (text && text.length > 10) bodyParts.push(text);
        });
        const body = bodyParts.join("\n").slice(0, 1500);
        if (body.length < 20) return;

        const img = el.querySelector("img[src]");
        const imageUrl = img?.getAttribute("src") ?? null;

        const time = el.querySelector("time[datetime]");
        const publishedAt = time?.getAttribute("datetime") ?? null;

        results.push({ title, body, imageUrl, publishedAt });
      });

      return results.map((item) => ({
        ...item,
        sourceUrl,
      }));
    }, url);

    return items
      .filter((item) => item.body.length >= 20)
      .slice(0, 20)
      .map((item) => ({
        ...item,
        imageUrl: item.imageUrl && !item.imageUrl.startsWith("http")
          ? new URL(item.imageUrl, url).href
          : item.imageUrl,
        externalId: hashId(url, item.body),
      }));
  } finally {
    await browser.close();
  }
}
