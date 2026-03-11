import ScrapeHealthClient from "./scrape-health-client";
import { requireManagerPageAccess } from "@/lib/auth/managerPageGuard";

export default async function ScrapeHealthPage() {
  await requireManagerPageAccess({ nextPath: "/scrape-health" });

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Scraper Health Dashboard</h1>
      <p className="mt-2 max-w-2xl text-neutral-600">
        Monitor the status of each partner organisation&rsquo;s scraper.
        Alerts fire when a scrape fails or data goes stale, so you can fix it
        before clients see outdated events.
      </p>
      <div className="mt-8">
        <ScrapeHealthClient />
      </div>
    </main>
  );
}
