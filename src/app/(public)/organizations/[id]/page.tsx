"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface WrapOrg {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  websiteUrl: string | null;
}

interface WrapService {
  id: string;
  title: string;
  description: string;
  category: string;
  eligibility_badge: string | null;
  is_crisis: boolean;
  availability_status: "open" | "busy" | "waitlist_closed";
}

interface WrapEvent {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  location_name: string | null;
  city: string | null;
}

function statusBadge(status: WrapService["availability_status"]) {
  if (status === "open") return "bg-emerald-100 text-emerald-800";
  if (status === "busy") return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

export default function OrganizationWraparoundPage({ params }: { params: { id: string } }) {
  const [org, setOrg] = useState<WrapOrg | null>(null);
  const [services, setServices] = useState<WrapService[]>([]);
  const [events, setEvents] = useState<WrapEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/organizations/${params.id}/wraparound`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load organization profile.");
        setOrg(data.organization);
        setServices(data.services ?? []);
        setEvents(data.events ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params.id]);

  if (loading) {
    return <main className="mx-auto max-w-6xl px-6 py-12 text-sm text-neutral-500">Loading profile...</main>;
  }

  if (error || !org) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error ?? "Organization not found."}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 space-y-6">
      <header className="rounded-2xl border border-neutral-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Organization Profile</p>
        <h1 className="mt-1 text-3xl font-bold text-brand-slate">{org.name}</h1>
        <p className="mt-2 max-w-3xl text-sm text-neutral-600">
          {org.description ?? "No description provided yet."}
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-neutral-500">
          {org.city && <span>{org.city}</span>}
          {org.websiteUrl && (
            <a href={org.websiteUrl} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
              Website
            </a>
          )}
          <Link href="/events" className="underline hover:no-underline">Back to Discovery</Link>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-brand-slate">Services</h2>
          <p className="mt-1 text-xs text-neutral-500">Long-term support offerings</p>
          <div className="mt-4 space-y-3">
            {services.map((service) => (
              <article key={service.id} className="rounded-xl border border-neutral-100 bg-neutral-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-neutral-900">{service.title}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadge(service.availability_status)}`}>
                    {service.availability_status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-600">{service.category}</p>
                <p className="mt-2 text-sm text-neutral-700">{service.description}</p>
                {service.eligibility_badge && (
                  <p className="mt-2 text-xs text-amber-900">{service.eligibility_badge}</p>
                )}
              </article>
            ))}
            {services.length === 0 && (
              <p className="text-sm text-neutral-500">No services listed yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-brand-slate">Events</h2>
          <p className="mt-1 text-xs text-neutral-500">Upcoming community activities</p>
          <div className="mt-4 space-y-3">
            {events.map((event) => (
              <article key={event.id} className="rounded-xl border border-neutral-100 bg-neutral-50 p-3">
                <h3 className="text-sm font-semibold text-neutral-900">{event.title}</h3>
                <p className="mt-1 text-xs text-neutral-600">
                  {new Date(event.start_at).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {event.location_name ? ` • ${event.location_name}` : ""}
                </p>
                {event.description && <p className="mt-2 text-sm text-neutral-700">{event.description}</p>}
              </article>
            ))}
            {events.length === 0 && (
              <p className="text-sm text-neutral-500">No upcoming events published yet.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
