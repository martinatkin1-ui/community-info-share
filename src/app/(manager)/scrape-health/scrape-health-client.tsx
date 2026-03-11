"use client";

import { useCallback, useEffect, useState } from "react";

interface ScrapeJobSummary {
  status:       string;
  eventsFound:  number;
  scrapedAt:    string;
  provider:     string;
  errorMessage: string | null;
  warnings:     string[];
}

interface OrgHealth {
  organizationId:   string;
  organizationName: string;
  scrapingUrl:      string;
  alertLevel:       "ok" | "warning" | "critical";
  summary:          string;
  lastJob:          ScrapeJobSummary | null;
}

const LEVEL_STYLES: Record<OrgHealth["alertLevel"], string> = {
  ok:       "border-emerald-200 bg-emerald-50",
  warning:  "border-amber-200   bg-amber-50",
  critical: "border-red-200     bg-red-50",
};
const LEVEL_BADGE: Record<OrgHealth["alertLevel"], string> = {
  ok:       "bg-emerald-100 text-emerald-800",
  warning:  "bg-amber-100   text-amber-800",
  critical: "bg-red-100     text-red-800",
};
const LEVEL_ICON: Record<OrgHealth["alertLevel"], string> = {
  ok:       "✅",
  warning:  "⚠️",
  critical: "🚨",
};

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60)   return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

export default function ScrapeHealthClient() {
  const [health, setHealth]     = useState<OrgHealth[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/scrape/health");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load.");
      setHealth(data.health ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  const counts = health.reduce(
    (acc, o) => { acc[o.alertLevel]++; return acc; },
    { ok: 0, warning: 0, critical: 0 }
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-neutral-100" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Summary bar ── */}
      <div className="flex flex-wrap gap-3">
        {(["critical", "warning", "ok"] as const).map((level) => (
          <div
            key={level}
            className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium ${LEVEL_BADGE[level]}`}
          >
            {LEVEL_ICON[level]} {counts[level]} {level}
          </div>
        ))}
        <button
          type="button"
          onClick={fetchHealth}
          className="ml-auto rounded-full border border-neutral-200 px-4 py-1.5 text-sm hover:bg-neutral-50"
        >
          ↻ Refresh
        </button>
      </div>

      {health.length === 0 && (
        <p className="text-sm text-neutral-500">
          No organisations with a scraping URL found. Add a{" "}
          <code className="rounded bg-neutral-100 px-1">scraping_url</code> to an
          organisation row to start monitoring it here.
        </p>
      )}

      {/* ── Per-org cards ── */}
      <div className="space-y-3">
        {health.map((org) => (
          <div
            key={org.organizationId}
            className={`rounded-xl border p-4 transition-colors ${LEVEL_STYLES[org.alertLevel]}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg" aria-hidden="true">{LEVEL_ICON[org.alertLevel]}</span>
                  <h2 className="font-semibold text-brand-slate truncate">{org.organizationName}</h2>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${LEVEL_BADGE[org.alertLevel]}`}>
                    {org.alertLevel}
                  </span>
                  {org.lastJob && (
                    <span className="text-xs text-neutral-500">
                      {timeAgo(org.lastJob.scrapedAt)} · {org.lastJob.provider}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-neutral-600">{org.summary}</p>
                <a
                  href={org.scrapingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 block truncate text-xs text-neutral-400 hover:text-brand-coral hover:underline"
                >
                  {org.scrapingUrl}
                </a>
              </div>

              <div className="flex gap-2">
                <a
                  href={`/scrape-dry-run?url=${encodeURIComponent(org.scrapingUrl)}`}
                  className="rounded-md bg-brand-slate px-3 py-1.5 text-xs font-medium text-white hover:opacity-80"
                >
                  Re-scrape
                </a>
                <button
                  type="button"
                  onClick={() =>
                    setExpanded((prev) => ({
                      ...prev,
                      [org.organizationId]: !prev[org.organizationId],
                    }))
                  }
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs hover:bg-white"
                >
                  {expanded[org.organizationId] ? "Hide" : "Details"}
                </button>
              </div>
            </div>

            {/* ── Expanded detail ── */}
            {expanded[org.organizationId] && org.lastJob && (
              <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-3 text-xs space-y-1">
                <p><span className="font-medium">Events found:</span> {org.lastJob.eventsFound}</p>
                <p><span className="font-medium">Provider:</span> {org.lastJob.provider}</p>
                <p><span className="font-medium">Scraped at:</span>{" "}
                  {new Date(org.lastJob.scrapedAt).toLocaleString("en-GB")}
                </p>
                {org.lastJob.errorMessage && (
                  <p className="text-red-700">
                    <span className="font-medium">Error:</span> {org.lastJob.errorMessage}
                  </p>
                )}
                {org.lastJob.warnings.length > 0 && (
                  <div>
                    <p className="font-medium">Warnings:</p>
                    <ul className="list-disc pl-4 text-amber-800">
                      {org.lastJob.warnings.map((w) => <li key={w}>{w}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
