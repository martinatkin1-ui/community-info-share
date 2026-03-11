"use client";

import { useMemo, useState } from "react";

import type { ScrapeDryRunResult, ScrapedEvent, ScraperProvider } from "@/types/scraping";

type PublishResponse = {
  status: string;
  approvedCount: number;
  message: string;
};

const PROVIDER_OPTIONS: Array<{ value: ScraperProvider; label: string }> = [
  { value: "auto", label: "Auto (Firecrawl -> Playwright fallback)" },
  { value: "playwright", label: "Playwright (headless browser)" },
  { value: "firecrawl", label: "Firecrawl (LLM-assisted scrape)" },
];

export default function ScrapeDryRunClient() {
  const [url, setUrl] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [provider, setProvider] = useState<ScraperProvider>("auto");
  const [result, setResult] = useState<ScrapeDryRunResult | null>(null);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishResult, setPublishResult] = useState<PublishResponse | null>(null);

  const selectedEvents = useMemo(() => {
    if (!result) {
      return [] as ScrapedEvent[];
    }

    return result.events.filter((event) => selectedIds[event.tempId]);
  }, [result, selectedIds]);

  async function runDryRun() {
    setError(null);
    setPublishResult(null);
    setLoading(true);

    try {
      const response = await fetch("/api/scrape/dry-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, provider }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Dry run failed.");
      }

      const dryRunResult = payload as ScrapeDryRunResult;
      setResult(dryRunResult);

      const initialSelection: Record<string, boolean> = {};
      for (const event of dryRunResult.events) {
        initialSelection[event.tempId] = event.confidence >= 0.6;
      }
      setSelectedIds(initialSelection);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Dry run failed.");
      setResult(null);
      setSelectedIds({});
    } finally {
      setLoading(false);
    }
  }

  async function publishApproved() {
    if (!result || selectedEvents.length === 0) {
      return;
    }

    setPublishing(true);
    setError(null);

    try {
      const response = await fetch("/api/events/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: organizationId.trim() || undefined,
          sourceUrl: result.sourceUrl,
          approvedEvents: selectedEvents,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Publish failed.");
      }

      setPublishResult(payload as PublishResponse);
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "Publish failed.");
    } finally {
      setPublishing(false);
    }
  }

  function toggleSelection(tempId: string) {
    setSelectedIds((current) => ({
      ...current,
      [tempId]: !current[tempId],
    }));
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 rounded-xl border border-neutral-200 bg-white p-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-sm font-medium">Organization URL</span>
          <input
            type="url"
            placeholder="https://example.org/events"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Scraper Provider</span>
          <select
            value={provider}
            onChange={(event) => setProvider(event.target.value as ScraperProvider)}
            className="rounded-md border border-neutral-300 px-3 py-2"
          >
            {PROVIDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Organization ID (optional)</span>
          <input
            type="text"
            placeholder="UUID used during publish"
            value={organizationId}
            onChange={(event) => setOrganizationId(event.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2"
          />
        </label>

        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={runDryRun}
            disabled={loading || url.trim().length < 8}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Scraping..." : "Run Dry Run"}
          </button>
        </div>
      </section>

      {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      {result ? (
        <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm text-neutral-500">Provider used: {result.provider}</p>
              <p className="text-sm text-neutral-500">Candidates found: {result.totalCandidates}</p>
            </div>
            <button
              type="button"
              onClick={publishApproved}
              disabled={publishing || selectedEvents.length === 0}
              className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {publishing ? "Submitting..." : `Approve ${selectedEvents.length} and Publish`}
            </button>
          </div>

          {result.warnings.length > 0 ? (
            <div className="space-y-1 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {result.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left">
                  <th className="px-2 py-2">Keep</th>
                  <th className="px-2 py-2">Event</th>
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Time</th>
                  <th className="px-2 py-2">Confidence</th>
                  <th className="px-2 py-2">Source Snippet</th>
                </tr>
              </thead>
              <tbody>
                {result.events.map((event) => (
                  <tr key={event.tempId} className="border-b border-neutral-100 align-top">
                    <td className="px-2 py-3">
                      <input
                        type="checkbox"
                        checked={Boolean(selectedIds[event.tempId])}
                        onChange={() => toggleSelection(event.tempId)}
                      />
                    </td>
                    <td className="px-2 py-3 font-medium">{event.eventName}</td>
                    <td className="px-2 py-3">{event.dateText}</td>
                    <td className="px-2 py-3">{event.timeText ?? "-"}</td>
                    <td className="px-2 py-3">{Math.round(event.confidence * 100)}%</td>
                    <td className="max-w-md px-2 py-3 text-neutral-600">{event.sourceSnippet}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {publishResult ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {publishResult.message} ({publishResult.approvedCount} approved)
        </p>
      ) : null}
    </div>
  );
}
