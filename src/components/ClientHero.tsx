"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import HeroBanner from "@/components/HeroBanner";

const HERO_IMAGE_DEFAULT = "/images/local-area/birmingham-canal.jpg";

export default function ClientHero() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"events" | "organizations">("events");
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/hero-image?query=Birmingham%20canal%20minimal%20skyline", {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((payload) => {
        if (payload?.url) {
          setBackgroundImage(payload.url);
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/${mode}?${params.toString()}`);
  }

  return (
    <HeroBanner
      className="px-4 py-16 sm:py-24"
      contentClassName="mx-auto max-w-6xl"
      eyebrow="West Midlands Community Discovery"
      title="Find Local Support, Right Now"
      description="Explore events, services, and organisations across Birmingham, Wolverhampton, Coventry, and surrounding communities."
      imageUrl={backgroundImage ?? HERO_IMAGE_DEFAULT}
      imagePositionClassName="object-[center_50%] sm:object-[center_42%]"
    >
      <div className="hero-glass-panel rounded-3xl border border-white/40 bg-white/70 p-6 text-center shadow-2xl sm:p-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-coral sm:text-sm">
          West Midlands Community Discovery
        </p>

        <p className="text-4xl font-bold leading-tight text-brand-slate sm:text-5xl lg:text-6xl" role="presentation">
          Find Local Support,
          <span className="text-brand-coral"> Right Now</span>
        </p>

        <p className="mx-auto mt-5 max-w-2xl text-base text-neutral-700 sm:text-lg">
          Explore events, services, and organisations across Birmingham, Wolverhampton,
          Coventry, and surrounding communities.
        </p>

        {/* Tabs in a solid card to preserve hierarchy over photography */}
        <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-neutral-200 bg-white p-5 shadow-lg">
          <div className="inline-flex rounded-xl border border-neutral-200 bg-neutral-50 p-1" role="tablist">
            {(["events", "organizations"] as const).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={`
                    rounded-lg px-5 py-2 text-sm font-semibold transition-all
                    ${mode === m
                      ? "bg-brand-slate text-white shadow-sm"
                      : "text-neutral-600 hover:text-brand-slate"
                    }
                  `}
              >
                {m === "events" ? "Events" : "Organisations"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="mt-4">
            <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow ring-1 ring-neutral-200 focus-within:ring-2 focus-within:ring-brand-coral/60 sm:flex-row">
              <label className="sr-only" htmlFor="hero-search">
                Search {mode} in the West Midlands
              </label>

              <span className="flex shrink-0 items-center gap-1.5 border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-500 sm:border-b-0 sm:border-r">
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
                    ? "Recovery workshops, wellbeing groups..."
                    : "Housing support, mental health, debt advice..."
                }
                className="flex-1 bg-transparent px-4 py-4 text-base text-brand-slate placeholder:text-neutral-400 focus:outline-none"
              />

              <button
                type="submit"
                className="m-2 shrink-0 rounded-xl bg-brand-slate px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-slate/90 focus:outline-none focus:ring-2 focus:ring-brand-coral focus:ring-offset-2"
              >
                Search
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {["Mental health", "Housing", "Food support", "Debt advice", "Employment"].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setQuery(tag);
                  router.push(`/${mode}?q=${encodeURIComponent(tag)}`);
                }}
                className="rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-700 transition hover:border-brand-sky/50 hover:bg-brand-sky/10"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </HeroBanner>
  );
}
