"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface PublicOrg {
  id: string;
  name: string;
  city: string | null;
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<PublicOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/organizations");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load organizations.");
        setOrganizations(data.organizations ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Organizations</h1>
      <p className="mt-3 text-neutral-600">
        Browse verified community organizations and view their wraparound offer of services and events.
      </p>

      {loading && <p className="mt-6 text-sm text-neutral-500">Loading organizations...</p>}
      {error && <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {!loading && !error && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {organizations.map((org) => (
            <Link
              key={org.id}
              href={`/organizations/${org.id}`}
              className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-brand-sky/40 hover:bg-neutral-50"
            >
              <h2 className="text-base font-semibold text-brand-slate">{org.name}</h2>
              <p className="mt-1 text-xs text-neutral-500">{org.city ?? "West Midlands"}</p>
            </Link>
          ))}

          {organizations.length === 0 && (
            <p className="text-sm text-neutral-500">No verified organizations yet.</p>
          )}
        </div>
      )}
    </main>
  );
}
