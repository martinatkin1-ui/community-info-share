"use client";

import Fuse from "fuse.js";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { SupportService } from "@/types/services";
import ServiceCard from "./ServiceCard";

type NeedKey = "debt" | "housing" | "mental_health" | "family" | "employment" | "advocacy";

const NEED_LABELS: Array<{ key: NeedKey; label: string }> = [
  { key: "debt", label: "I need help with debt" },
  { key: "housing", label: "I need housing support" },
  { key: "mental_health", label: "I need mental health support" },
  { key: "family", label: "I need family support" },
  { key: "employment", label: "I need work support" },
  { key: "advocacy", label: "I need advocacy" },
];

const NEED_TO_TAG: Record<NeedKey, string> = {
  debt: "debt",
  housing: "housing",
  mental_health: "mental-health",
  family: "family",
  employment: "employment",
  advocacy: "advocacy",
};

const QUERY_SYNONYM_MAP: Array<{ test: RegExp; mapsTo: NeedKey }> = [
  { test: /money|debt|rent|arrears|bills/i, mapsTo: "debt" },
  { test: /house|housing|homeless|accommodation/i, mapsTo: "housing" },
  { test: /anxiety|depress|mental|wellbeing|panic/i, mapsTo: "mental_health" },
  { test: /family|parent|child|domestic/i, mapsTo: "family" },
  { test: /job|work|employment|cv|benefits/i, mapsTo: "employment" },
  { test: /rights|legal|advocacy|support worker/i, mapsTo: "advocacy" },
];

interface ServiceDiscoveryProps {
  query: string;
}

export default function ServiceDiscovery({ query }: ServiceDiscoveryProps) {
  const [services, setServices] = useState<SupportService[]>([]);
  const [needFilter, setNeedFilter] = useState<NeedKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mappedNeedFromQuery = useMemo(() => {
    for (const rule of QUERY_SYNONYM_MAP) {
      if (rule.test.test(query)) return rule.mapsTo;
    }
    return null;
  }, [query]);

  useEffect(() => {
    if (!needFilter && mappedNeedFromQuery) {
      setNeedFilter(mappedNeedFromQuery);
    }
  }, [mappedNeedFromQuery, needFilter]);

  const fetchServices = useCallback(async (need: NeedKey | null) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ city: "Wolverhampton", limit: "120" });
      if (need) params.set("need", NEED_TO_TAG[need]);

      const res = await fetch(`/api/services?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load services.");
      setServices(data.services ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices(needFilter);
  }, [needFilter, fetchServices]);

  const filtered = useMemo(() => {
    if (!query.trim()) return services;

    const fuse = new Fuse(services, {
      threshold: 0.38,
      includeScore: true,
      keys: [
        { name: "title", weight: 0.45 },
        { name: "description", weight: 0.25 },
        { name: "category", weight: 0.15 },
        { name: "needTags", weight: 0.15 },
      ],
    });

    return fuse.search(query.trim()).map((r) => r.item);
  }, [services, query]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {NEED_LABELS.map((need) => (
          <button
            key={need.key}
            type="button"
            onClick={() => setNeedFilter((prev) => (prev === need.key ? null : need.key))}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              needFilter === need.key
                ? "border-brand-slate bg-brand-slate text-white"
                : "border-brand-sky/30 bg-white text-brand-slate hover:bg-brand-sky/10"
            }`}
          >
            {need.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {loading && (
        <div className="masonry-2 sm:masonry-3 lg:masonry-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="break-inside-avoid mb-4 h-48 animate-pulse rounded-2xl bg-neutral-100" />
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="masonry-2 sm:masonry-3 lg:masonry-4">
          {filtered.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-brand-sky/40 bg-white py-16 text-center">
          <p className="text-lg font-semibold text-brand-slate">No services match this search yet</p>
          <p className="mt-1 text-sm text-neutral-500">
            Try a different phrase like &ldquo;money problems&rdquo;, &ldquo;housing&rdquo;, or &ldquo;mental health support&rdquo;.
          </p>
        </div>
      )}
    </section>
  );
}
