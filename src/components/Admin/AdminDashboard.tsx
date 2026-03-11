"use client";

import { AlertCircle, Building2, CheckCircle2, Database } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import InviteManagerPanel from "./InviteManagerPanel";
import VerificationDrawer from "./VerificationDrawer";

interface PendingOrgRow {
  id: string;
  name: string;
  type: string;
  websiteUrl: string | null;
}

interface AdminStats {
  totalActiveOrgs: number;
  pendingVerifications: number;
  scraperHealthPct: number;
}

function typeBadge(type: string) {
  const key = type.toLowerCase();
  if (key.includes("nhs")) return "bg-sky-100 text-sky-800";
  if (key.includes("lero") || key.includes("recovery")) return "bg-orange-100 text-orange-800";
  if (key.includes("council") || key.includes("local authority")) return "bg-violet-100 text-violet-800";
  return "bg-neutral-100 text-neutral-700";
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [rows, setRows] = useState<PendingOrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/dashboard");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load admin data.");
      setStats(data.stats);
      setRows(data.pendingOrganizations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const healthTone = useMemo(() => {
    const pct = stats?.scraperHealthPct ?? 0;
    if (pct >= 80) return "text-emerald-700";
    if (pct >= 50) return "text-amber-700";
    return "text-red-700";
  }, [stats?.scraperHealthPct]);

  function openDrawer(orgId: string) {
    setSelectedOrgId(orgId);
    setDrawerOpen(true);
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-4 lg:grid-cols-[240px,1fr] lg:p-6">
        <aside className="rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Admin</p>
          <h1 className="mt-1 text-xl font-semibold text-neutral-900">Control Panel</h1>
          <nav className="mt-4 space-y-2 text-sm">
            <a className="block rounded-lg bg-neutral-900 px-3 py-2 font-medium text-white" href="#queue">Pending Queue</a>
            <a className="block rounded-lg px-3 py-2 text-neutral-600 hover:bg-neutral-100" href="#stats">Live Stats</a>
          </nav>
        </aside>

        <main className="space-y-6">
          <section id="stats" className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <CheckCircle2 className="h-4 w-4" /> Total Active Orgs
              </p>
              <p className="mt-3 text-3xl font-bold text-neutral-900">{stats?.totalActiveOrgs ?? "-"}</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <AlertCircle className="h-4 w-4" /> Pending Verifications
              </p>
              <p className="mt-3 text-3xl font-bold text-neutral-900">{stats?.pendingVerifications ?? "-"}</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <Database className="h-4 w-4" /> Scraper Health %
              </p>
              <p className={`mt-3 text-3xl font-bold ${healthTone}`}>{stats?.scraperHealthPct ?? "-"}%</p>
            </div>
          </section>

          <InviteManagerPanel organizations={rows.map((row) => ({ id: row.id, name: row.name }))} />

          <section id="queue" className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">Pending Queue</h2>
              <button
                type="button"
                onClick={load}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Refresh
              </button>
            </div>

            {loading && <p className="text-sm text-neutral-500">Loading queue...</p>}
            {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                      <th className="px-2 py-2">Name</th>
                      <th className="px-2 py-2">Type</th>
                      <th className="px-2 py-2">Website</th>
                      <th className="px-2 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((org) => (
                      <tr key={org.id} className="border-b border-neutral-100 align-top hover:bg-neutral-50/80">
                        <td className="px-2 py-3">
                          <div className="flex min-w-[220px] items-start gap-2">
                            <Building2 className="mt-0.5 h-4 w-4 text-neutral-400" />
                            <span className="font-medium text-neutral-900 break-words">{org.name}</span>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${typeBadge(org.type)}`}>
                            {org.type}
                          </span>
                        </td>
                        <td className="px-2 py-3">
                          <a
                            href={org.websiteUrl ?? "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block max-w-[320px] truncate text-neutral-600 underline-offset-2 hover:underline"
                            title={org.websiteUrl ?? "No URL"}
                          >
                            {org.websiteUrl ?? "No website provided"}
                          </a>
                        </td>
                        <td className="px-2 py-3">
                          <button
                            type="button"
                            onClick={() => openDrawer(org.id)}
                            className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}

                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-2 py-10 text-center text-sm text-neutral-500">
                          No organizations pending verification.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>

      <VerificationDrawer
        organizationId={selectedOrgId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onActionComplete={load}
      />
    </div>
  );
}
