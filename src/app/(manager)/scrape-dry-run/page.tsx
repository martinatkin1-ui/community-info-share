import ScrapeDryRunClient from "./scrape-dry-run-client";

export default function ScrapeDryRunPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Event Scraper Dry Run</h1>
      <p className="mt-3 max-w-3xl text-neutral-600">
        Paste an organization page URL, run extraction, and manually approve events before publishing.
      </p>
      <div className="mt-8">
        <ScrapeDryRunClient />
      </div>
    </main>
  );
}
