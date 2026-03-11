import { runScrapeRoute } from "@/lib/scraping/runScrapeRoute";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return runScrapeRoute(request);
}
