import { Link2, Loader2, Sparkles } from "lucide-react";

import { useOnboarding } from "../OnboardingContext";

export default function StepDataEngine() {
  const { values, errors, scrapeState, onFieldChange, testScrape } = useOnboarding();

  return (
    <section className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-brand-slate">Primary Website</label>
        <div className="relative mt-1">
          <Link2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-brand-slate/50" />
          <input
            type="url"
            value={values.websiteUrl}
            onChange={(e) => onFieldChange("websiteUrl", e.target.value)}
            placeholder="https://www.example.org"
            className="w-full rounded-xl border border-brand-sky/40 bg-white py-2.5 pl-10 pr-3 text-sm outline-none ring-brand-sky transition focus:ring-2"
          />
        </div>
        {errors.websiteUrl && <p className="mt-1 text-xs text-red-600">{errors.websiteUrl}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-brand-slate">Events / Groups URLs</label>
        <div className="relative mt-1">
          <Link2 className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-brand-slate/50" />
          <textarea
            value={values.scrapingUrls}
            onChange={(e) => onFieldChange("scrapingUrls", e.target.value)}
            placeholder={"https://www.example.org/events\nhttps://www.example.org/groups"}
            rows={4}
            className="w-full rounded-xl border border-brand-sky/40 bg-white py-2.5 pl-10 pr-3 text-sm outline-none ring-brand-sky transition focus:ring-2"
          />
        </div>
        <p className="mt-1 text-xs text-neutral-600">Add one URL per line (or separate with commas).</p>
        {errors.scrapingUrls && <p className="mt-1 text-xs text-red-600">{errors.scrapingUrls}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-brand-slate">News / Announcements URL <span className="font-normal text-neutral-500">(optional)</span></label>
        <div className="relative mt-1">
          <Link2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-brand-slate/50" />
          <input
            type="url"
            value={values.newsUrl}
            onChange={(e) => onFieldChange("newsUrl", e.target.value)}
            placeholder="https://www.example.org/news or /blog or /announcements"
            className="w-full rounded-xl border border-brand-sky/40 bg-white py-2.5 pl-10 pr-3 text-sm outline-none ring-brand-sky transition focus:ring-2"
          />
        </div>
        <p className="mt-1 text-xs text-neutral-600">We'll scrape this page weekly for news to show on the community feed.</p>
        {errors.newsUrl && <p className="mt-1 text-xs text-red-600">{errors.newsUrl}</p>}
      </div>

      <div className="rounded-xl border border-brand-amber/40 bg-gradient-to-r from-brand-amber/20 to-brand-cream p-4">
        <p className="text-sm text-brand-slate">
          Run a quick check so our AI can locate your event listings reliably.
        </p>
        <button
          type="button"
          onClick={testScrape}
          disabled={scrapeState === "testing"}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-slate px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {scrapeState === "testing" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Testing scrape...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Test Scrape
            </>
          )}
        </button>
        {scrapeState === "success" && (
          <p className="mt-2 text-xs font-medium text-emerald-700">
            Mock result: scraper can read this page structure.
          </p>
        )}
      </div>
    </section>
  );
}
