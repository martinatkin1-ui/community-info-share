"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, Mail, Phone, Play, Wrench, X } from "lucide-react";
import { useEffect, useState } from "react";

interface OrgDetail {
  id: string;
  name: string;
  bio: string | null;
  websiteUrl: string | null;
  scrapingUrl: string | null;
  scrapingUrls?: string[];
  email: string | null;
  phone: string | null;
  socials: {
    facebook?: string | null;
    instagram?: string | null;
    x?: string | null;
  };
}

interface PreviewEvent {
  title: string;
  date: string;
  sourceUrl: string;
}

interface VerificationDrawerProps {
  organizationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionComplete: () => void;
}

export default function VerificationDrawer({
  organizationId,
  open,
  onOpenChange,
  onActionComplete,
}: VerificationDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [preview, setPreview] = useState<PreviewEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [tweak, setTweak] = useState("");
  const [actionLoading, setActionLoading] = useState<"verify" | "changes" | "fix" | "scrape" | null>(null);
  const [scrapeResult, setScrapeResult] = useState<{ count: number; warnings: string[] } | null>(null);

  useEffect(() => {
    if (!open || !organizationId) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/organizations/${organizationId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load organization details.");
        setOrg(data.organization);
        setPreview(data.scraperPreview ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [open, organizationId]);

  async function runAction(action: "verify" | "request_changes" | "fix_scraper") {
    if (!organizationId) return;

    setActionLoading(action === "verify" ? "verify" : action === "request_changes" ? "changes" : "fix");
    setError(null);

    try {
      const res = await fetch(`/api/admin/organizations/${organizationId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          feedback: action === "request_changes" ? feedback : undefined,
          tweak: action === "fix_scraper" ? tweak : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed.");

      if (action === "verify") {
        onActionComplete();
        onOpenChange(false);
      } else {
        onActionComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setActionLoading(null);
    }
  }

  async function runScrape() {
    const scrapeUrl = org?.scrapingUrls?.[0] ?? org?.scrapingUrl;
    if (!scrapeUrl || !organizationId) return;

    setActionLoading("scrape");
    setScrapeResult(null);
    setError(null);

    try {
      const dryRes = await fetch("/api/scrape/dry-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl, provider: "auto" }),
      });
      const dryData = await dryRes.json();
      if (!dryRes.ok) throw new Error(dryData.error ?? "Scrape failed.");

      const events = (dryData.events ?? []).filter(
        (e: { confidence: number }) => e.confidence >= 0.5
      );

      if (events.length === 0) {
        setScrapeResult({ count: 0, warnings: dryData.warnings ?? ["No events found on the page."] });
        return;
      }

      const pubRes = await fetch("/api/events/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          sourceUrl: dryData.sourceUrl ?? scrapeUrl,
          approvedEvents: events,
        }),
      });
      const pubData = await pubRes.json();
      if (!pubRes.ok) throw new Error(pubData.error ?? "Publish failed.");

      setScrapeResult({
        count: pubData.approvedCount ?? events.length,
        warnings: dryData.warnings ?? [],
      });
      onActionComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scrape failed.");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Dialog.Content className="fixed right-0 top-0 z-50 h-full w-full max-w-xl overflow-y-auto border-l border-neutral-200 bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between">
            <Dialog.Title className="text-xl font-semibold text-neutral-900">Organization Deep Dive</Dialog.Title>
            <Dialog.Close className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100" aria-label="Close">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {loading && (
            <div className="mt-6 flex items-center gap-2 text-sm text-neutral-600">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading profile...
            </div>
          )}

          {!loading && error && (
            <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}

          {!loading && !error && org && (
            <div className="mt-6 space-y-6">
              <section className="rounded-xl border border-neutral-200 p-4">
                <h3 className="font-semibold text-neutral-900">Org Details</h3>
                <p className="mt-2 text-sm text-neutral-700">{org.bio ?? "No bio provided."}</p>

                <dl className="mt-3 space-y-1 text-sm">
                  <div className="flex gap-2"><dt className="font-medium text-neutral-800">Website:</dt><dd className="min-w-0 break-all text-neutral-600">{org.websiteUrl ?? "-"}</dd></div>
                  <div className="flex gap-2"><dt className="font-medium text-neutral-800">Scraping URLs:</dt><dd className="min-w-0 break-all text-neutral-600">{org.scrapingUrls?.length ? org.scrapingUrls.join(", ") : org.scrapingUrl ?? "-"}</dd></div>
                  <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-neutral-500" /><dd className="text-neutral-600">{org.email ?? "-"}</dd></div>
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-neutral-500" /><dd className="text-neutral-600">{org.phone ?? "-"}</dd></div>
                </dl>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {org.socials.facebook && <span className="rounded-full bg-neutral-100 px-2 py-1">Facebook: {org.socials.facebook}</span>}
                  {org.socials.instagram && <span className="rounded-full bg-neutral-100 px-2 py-1">Instagram: {org.socials.instagram}</span>}
                  {org.socials.x && <span className="rounded-full bg-neutral-100 px-2 py-1">X: {org.socials.x}</span>}
                </div>
              </section>

              <section className="rounded-xl border border-neutral-200 p-4">
                <h3 className="font-semibold text-neutral-900">Scraper Preview</h3>
                <ul className="mt-3 space-y-2">
                  {preview.map((event) => (
                    <li key={`${event.title}-${event.date}`} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                      <p className="text-sm font-medium text-neutral-900">{event.title}</p>
                      <p className="text-xs text-neutral-600">{new Date(event.date).toLocaleDateString("en-GB")}</p>
                      <p className="mt-1 text-[11px] break-all text-neutral-500">{event.sourceUrl}</p>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="space-y-3 rounded-xl border border-neutral-200 p-4">
                <h3 className="font-semibold text-neutral-900">Quality Control Actions</h3>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => runAction("verify")}
                    disabled={actionLoading !== null}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {actionLoading === "verify" ? "Approving..." : "Approve / Verify"}
                  </button>

                  <button
                    type="button"
                    onClick={runScrape}
                    disabled={actionLoading !== null || !(org?.scrapingUrls?.[0] ?? org?.scrapingUrl)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                  >
                    <Play className="h-4 w-4" />
                    {actionLoading === "scrape" ? "Scraping..." : "Scrape Events"}
                  </button>
                </div>

                {scrapeResult && (
                  <div className={`rounded-lg border p-3 text-sm ${scrapeResult.count > 0 ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                    {scrapeResult.count > 0
                      ? `Scraped and published ${scrapeResult.count} event${scrapeResult.count === 1 ? "" : "s"}.`
                      : "No events found on the scraping URL."}
                    {scrapeResult.warnings.map((w, i) => (
                      <p key={i} className="mt-1 text-xs opacity-80">{w}</p>
                    ))}
                  </div>
                )}

                <div className="space-y-2 rounded-lg border border-neutral-200 p-3">
                  <label className="block text-xs font-medium text-neutral-700">Request Changes Feedback</label>
                  <textarea
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Please upload a higher-resolution logo and add service contact details."
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => runAction("request_changes")}
                    disabled={actionLoading !== null}
                    className="rounded-md bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                  >
                    {actionLoading === "changes" ? "Sending..." : "Request Changes"}
                  </button>
                </div>

                <div className="space-y-2 rounded-lg border border-neutral-200 p-3">
                  <label className="block text-xs font-medium text-neutral-700">Fix Scraper Override</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tweak}
                      onChange={(e) => setTweak(e.target.value)}
                      placeholder="e.g. Prioritize .events-list and ignore blog feed"
                      className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => runAction("fix_scraper")}
                      disabled={actionLoading !== null}
                      className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
                    >
                      <Wrench className="h-3.5 w-3.5" />
                      {actionLoading === "fix" ? "Saving..." : "Fix Scraper"}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
