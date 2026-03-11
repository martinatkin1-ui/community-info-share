"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ClientHero() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"events" | "organizations">("events");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/${mode}?${params.toString()}`);
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-slate via-[#3d4460] to-[#2D3142] px-4 py-20 sm:py-28">

      {/* Subtle decorative Wolverhampton skyline silhouette */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 opacity-10" aria-hidden="true">
        <svg viewBox="0 0 900 80" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="xMidYMax meet">
          <path fill="white" d="M0,80 L0,55 L30,55 L30,45 L60,45 L60,55 L100,55 L100,40 L140,40 L140,55 L180,55 L180,35 L220,35 L220,20 L224,20 L224,10 L228,10 L228,5 L232,5 L232,10 L236,10 L236,20 L240,20 L240,35 L280,35 L280,55 L320,55 L320,38 L360,38 L360,55 L400,55 L400,42 L440,42 L440,55 L480,55 L480,30 L520,30 L520,55 L560,55 L560,44 L600,44 L600,55 L640,55 L640,48 L680,48 L680,55 L720,55 L720,40 L760,40 L760,55 L800,55 L800,48 L900,48 L900,80 Z"/>
        </svg>
      </div>

      <div className="relative mx-auto max-w-3xl text-center">

        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-coral">
          West Midlands · Wolverhampton
        </p>

        <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
          Find Local Support,{" "}
          <span className="text-brand-coral">Right Now</span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-lg text-neutral-300">
          Discover community events, wellbeing services, and organisations
          across the West Midlands — all in one place.
        </p>

        {/* Mode toggle */}
        <div className="mt-8 inline-flex rounded-xl border border-white/20 bg-white/10 p-1" role="tablist">
          {(["events", "organizations"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`
                rounded-lg px-5 py-2 text-sm font-semibold transition-all
                ${mode === m
                  ? "bg-white text-brand-slate shadow-sm"
                  : "text-white/80 hover:text-white"
                }
              `}
            >
              {m === "events" ? "Events" : "Organisations"}
            </button>
          ))}
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="mt-4">
          <div className="flex overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-white/10 focus-within:ring-2 focus-within:ring-brand-coral/60">
            <label className="sr-only" htmlFor="hero-search">
              Search {mode} in the West Midlands
            </label>

            {/* Location badge */}
            <span className="flex shrink-0 items-center gap-1.5 border-r border-neutral-200 bg-neutral-50 pl-4 pr-3 text-sm text-neutral-500">
              <svg className="h-4 w-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              West Midlands
            </span>

            <input
              id="hero-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                mode === "events"
                  ? "Recovery workshops, wellbeing groups…"
                  : "Housing support, mental health, debt advice…"
              }
              className="flex-1 bg-transparent px-4 py-4 text-base text-brand-slate placeholder:text-neutral-400 focus:outline-none"
            />

            <button
              type="submit"
              className="m-1.5 shrink-0 rounded-xl bg-brand-slate px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-slate/90 focus:outline-none focus:ring-2 focus:ring-brand-coral focus:ring-offset-2"
            >
              Search
            </button>
          </div>
        </form>

        {/* Quick-action chips */}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {["Mental health", "Housing", "Food support", "Debt advice", "Employment"].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setQuery(tag);
                router.push(`/${mode}?q=${encodeURIComponent(tag)}`);
              }}
              className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/20"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
