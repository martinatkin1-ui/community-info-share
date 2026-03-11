"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { DiscoveryEvent, EventCategory } from "@/types/events";
import CategoryTags from "./CategoryTags";
import SearchBar from "./SearchBar";
import ServiceDiscovery from "./ServiceDiscovery";
import WMBanner from "./WMBanner";

// ── Colour palette cycling for cards without images ──────────────────────────
const CARD_GRADIENTS = [
  "from-brand-coral/30  to-brand-blush",
  "from-brand-amber/30  to-brand-cream",
  "from-brand-lime/40   to-brand-sky/30",
  "from-brand-violet/30 to-brand-blush/40",
  "from-brand-sky/40    to-brand-lime/20",
  "from-brand-blush/50  to-brand-violet/20",
];

// ── Category pill colours (mirrors CategoryTags, read-only) ──────────────────
const CAT_PILL: Record<string, string> = {
  "Recovery":      "bg-brand-lime    text-emerald-800",
  "Mental Health": "bg-brand-violet   text-violet-900",
  "Housing":       "bg-brand-sky      text-sky-900",
  "Social":        "bg-brand-amber    text-amber-900",
  "Employment":    "bg-brand-blush    text-rose-900",
  "Family":        "bg-brand-coral/20 text-red-900",
};

function gradientFor(index: number) {
  return CARD_GRADIENTS[index % CARD_GRADIENTS.length];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
  });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Text-Me-the-Details button (Low-Data Mode) ──────────────────────────────────────
const PHONE_RE = /^[\d\s\+\(\)\-]{7,20}$/;

function TextMeButton({ event }: { event: DiscoveryEvent }) {
  const [open, setOpen]     = useState(false);
  const [phone, setPhone]   = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  async function handleSend() {
    if (!PHONE_RE.test(phone.trim())) {
      setErrMsg("Please enter a valid UK phone number.");
      return;
    }
    setStatus("sending");
    setErrMsg("");
    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          title: event.title,
          dateText: formatDate(event.startAtIso),
          timeText: formatTime(event.startAtIso),
          locationName: event.locationName ?? event.city ?? "",
          organizationName: event.organizationName,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "SMS failed.");
      }
      setStatus("sent");
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "Could not send SMS.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <p className="mt-2 text-xs font-medium text-emerald-700">
        ✅ Details sent to your phone!
      </p>
    );
  }

  return (
    <div className="mt-2">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border border-brand-coral/60 px-3 py-1 text-xs font-medium text-brand-coral hover:bg-brand-coral/10"
        >
          📱 Text me the details
        </button>
      ) : (
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="tel"
            placeholder="07700 900000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-md border border-neutral-300 px-2 py-1 text-xs w-36 focus:outline-none focus:ring-1 focus:ring-brand-coral"
            disabled={status === "sending"}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={status === "sending"}
            className="rounded-full bg-brand-coral px-3 py-1 text-xs font-medium text-white hover:bg-brand-coral/90 disabled:opacity-50"
          >
            {status === "sending" ? "Sending…" : "Send"}
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); setErrMsg(""); setStatus("idle"); }}
            className="text-xs text-neutral-400 hover:text-neutral-600"
          >
            Cancel
          </button>
          {errMsg && <p className="w-full text-xs text-red-600">{errMsg}</p>}
        </div>
      )}
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="break-inside-avoid mb-4 rounded-2xl bg-neutral-100 animate-pulse overflow-hidden">
      <div className="h-36 bg-neutral-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-3/4 bg-neutral-200 rounded" />
        <div className="h-3 w-1/2 bg-neutral-200 rounded" />
        <div className="h-3 w-2/3 bg-neutral-200 rounded" />
      </div>
    </div>
  );
}

// ── Single event card ─────────────────────────────────────────────────────────
function EventCard({ event, index, lowData = false }: { event: DiscoveryEvent; index: number; lowData?: boolean }) {
  return (
    <article
      className={`break-inside-avoid mb-4 rounded-2xl overflow-hidden shadow-sm
                 border border-white/60 bg-white
                 ${!lowData ? "hover:-translate-y-1 hover:shadow-md transition-transform duration-200" : ""}`}
    >
      {/* Image / colour banner — hidden in low-data mode */}
      {!lowData && (
        event.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.imageUrl}
            alt={`Flier for ${event.title}`}
            className="w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className={`h-28 bg-gradient-to-br ${gradientFor(index)} flex items-end p-3`}>
            <span className="text-3xl select-none" aria-hidden="true">
              {event.categories[0] === "Recovery"      ? "🌱"
             : event.categories[0] === "Mental Health" ? "💜"
             : event.categories[0] === "Housing"       ? "🏠"
             : event.categories[0] === "Social"        ? "☕"
             : event.categories[0] === "Employment"    ? "💼"
             : event.categories[0] === "Family"        ? "🤝"
             : "📅"}
            </span>
          </div>
        )
      )}

      <div className="p-4 space-y-2">
        {/* Category pills */}
        {event.categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {event.categories.slice(0, 3).map((cat) => (
              <span
                key={cat}
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${CAT_PILL[cat] ?? "bg-neutral-100 text-neutral-600"}`}
              >
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="font-semibold text-brand-slate leading-snug line-clamp-2">
          {event.title}
        </h3>

        {/* Org */}
        <p className="text-xs text-neutral-500 font-medium truncate">
          {event.organizationName}
        </p>

        {/* Date / time / location */}
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-neutral-500">
          <span>📅 {formatDate(event.startAtIso)}</span>
          <span>🕐 {formatTime(event.startAtIso)}</span>
          {(event.locationName ?? event.city) && (
            <span>📍 {event.locationName ?? event.city}</span>
          )}
        </div>

        {/* Description — hidden in low-data mode */}
        {!lowData && event.description && (
          <p className="text-sm text-neutral-600 line-clamp-3 leading-relaxed">
            {event.description}
          </p>
        )}

        {/* Text Me button — shown only in low-data mode */}
        {lowData && <TextMeButton event={event} />}

        {/* Scraped badge */}
        {event.isScraped && (
          <span className="inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-400">
            Auto-detected
          </span>
        )}
      </div>
    </article>
  );
}

// ── Main discovery feed ───────────────────────────────────────────────────────
type FeedState = "idle" | "loading" | "loaded" | "error";
type DiscoveryMode = "events" | "services";

export default function DiscoveryFeed() {
  const [mode, setMode]             = useState<DiscoveryMode>("events");
  const [query, setQuery]           = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [events, setEvents]         = useState<DiscoveryEvent[]>([]);
  const [feedState, setFeedState]   = useState<FeedState>("idle");
  const [error, setError]           = useState<string | null>(null);
  const [lowData, setLowData]       = useState(() =>
    typeof window !== "undefined" && localStorage.getItem("wm-low-data-mode") === "1"
  );

  function toggleLowData() {
    setLowData((prev) => {
      const next = !prev;
      localStorage.setItem("wm-low-data-mode", next ? "1" : "0");
      return next;
    });
  }

  // Debounce search input 350ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const fetchEvents = useCallback(async (q: string, cats: EventCategory[]) => {
    setFeedState("loading");
    setError(null);
    try {
      const params = new URLSearchParams({ city: "Wolverhampton", limit: lowData ? "20" : "40" });
      if (q)            params.set("q", q);
      if (cats.length)  params.set("category", cats.join(","));

      const res  = await fetch(`/api/events?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load events.");
      setEvents(data.events ?? []);
      setFeedState("loaded");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
      setFeedState("error");
    }
  }, [lowData]);

  useEffect(() => {
    fetchEvents(debouncedQ, categories);
  }, [debouncedQ, categories, fetchEvents]);

  function toggleCategory(cat: EventCategory) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <section className="space-y-6">

      {/* ── Greeting header ── */}
      <header className="rounded-3xl overflow-hidden bg-gradient-to-r from-brand-coral/20 via-brand-blush to-brand-violet/20">
        <WMBanner />
        <div className="px-6 pb-8 pt-4">
          <h1 className="text-3xl font-bold text-brand-slate sm:text-4xl">
            {greeting} 👋
          </h1>
          <p className="mt-1 text-lg text-neutral-600">
            What&rsquo;s happening in <span className="font-semibold text-brand-coral">the Black Country</span> this week?
          </p>
        </div>
      </header>

      {/* ── Discovery Toggle ── */}
      <div className="rounded-2xl border border-brand-sky/30 bg-white p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("events")}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              mode === "events"
                ? "bg-brand-slate text-white"
                : "bg-brand-sky/10 text-brand-slate hover:bg-brand-sky/20"
            }`}
          >
            Find Events
          </button>
          <button
            type="button"
            onClick={() => setMode("services")}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              mode === "services"
                ? "bg-brand-coral text-white"
                : "bg-brand-amber/20 text-brand-slate hover:bg-brand-amber/30"
            }`}
          >
            Find Support Services
          </button>
        </div>
      </div>

      {/* ── Search + category filters + low-data toggle ── */}
      <div className="space-y-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
        <SearchBar value={query} onChange={setQuery} />
        {mode === "events" ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CategoryTags active={categories} onToggle={toggleCategory} />
              <button
                type="button"
                onClick={toggleLowData}
                title={lowData ? "Switch to full experience" : "Reduce data usage and enable SMS"}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  lowData
                    ? "border-brand-coral/60 bg-brand-coral/10 text-brand-coral"
                    : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                }`}
              >
                📱 {lowData ? "Low-data on" : "Low-data mode"}
              </button>
            </div>
            {lowData && (
              <p className="text-xs text-neutral-500">
                Low-data mode is on — images hidden, fewer results. Tap “📱 Text me the details” on any card to get event info by SMS.
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-neutral-500">
            Search by need, service title, or plain language (e.g. &ldquo;money problems&rdquo;) to discover support services.
          </p>
        )}
      </div>

      {/* ── Results metadata ── */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-neutral-500">
          {mode === "events" && feedState === "loaded"
            ? events.length > 0
              ? `${events.length} upcoming event${events.length !== 1 ? "s" : ""}`
              : "No events found"
            : "\u00a0"}
        </p>
        {mode === "events" && categories.length > 0 && (
          <button
            type="button"
            onClick={() => setCategories([])}
            className="text-xs text-brand-coral hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Error state ── */}
      {feedState === "error" && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {mode === "services" && <ServiceDiscovery query={debouncedQ} />}

      {/* ── Masonry grid ── */}
      {mode === "events" && feedState === "loading" && (
        <div className="masonry-2 sm:masonry-3 lg:masonry-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {mode === "events" && feedState === "loaded" && events.length > 0 && (
        <div className="masonry-2 sm:masonry-3 lg:masonry-4">
          {events.map((event, i) => (
            <EventCard key={event.id} event={event} index={i} lowData={lowData} />
          ))}
        </div>
      )}

      {mode === "events" && feedState === "loaded" && events.length === 0 && (
        <div className="rounded-3xl border border-dashed border-neutral-200 bg-white py-20 text-center">
          <p className="text-5xl" aria-hidden="true">🔍</p>
          <p className="mt-4 text-lg font-medium text-neutral-700">Nothing found just yet</p>
          <p className="mt-1 text-sm text-neutral-500">
            Try clearing the filters or searching for something different.
          </p>
          <button
            type="button"
            onClick={() => { setQuery(""); setCategories([]); }}
            className="mt-4 rounded-full bg-brand-coral px-5 py-2 text-sm font-medium text-white hover:bg-brand-coral/90"
          >
            Show all events
          </button>
        </div>
      )}
    </section>
  );
}
