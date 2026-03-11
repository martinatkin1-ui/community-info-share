"use client";

import { Loader2, RefreshCcw } from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { ServiceAvailabilityStatus } from "@/types/services";

interface AuditLogEntry {
  id: string;
  actor_email: string | null;
  actor_role: string;
  action: string;
  changes: Record<string, unknown>;
  created_at: string;
}

interface ManagedServiceRow {
  id: string;
  title: string;
  category: string;
  eligibilityBadge: string;
  isCrisis: boolean;
  availabilityStatus: ServiceAvailabilityStatus;
  isActive: boolean;
  updatedAt: string;
  organizationId: string;
  organizationName: string;
  organizationCity: string | null;
  auditHistory: AuditLogEntry[];
}

const STATUS_OPTIONS: Array<{ value: ServiceAvailabilityStatus; label: string }> = [
  { value: "open", label: "Open" },
  { value: "busy", label: "Busy (2-week wait)" },
  { value: "waitlist_closed", label: "Waitlist Closed" },
];

export default function ServiceStatusManager() {
  const supabase = createBrowserSupabaseClient();
  const [services, setServices] = useState<ManagedServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [orgFilter, setOrgFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/manager/services");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load services.");
      setServices(data.services ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const organizations = useMemo(() => {
    const seen = new Map<string, string>();
    for (const service of services) {
      if (!seen.has(service.organizationId)) {
        seen.set(service.organizationId, service.organizationName);
      }
    }
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [services]);

  const filtered = useMemo(() => {
    if (orgFilter === "all") return services;
    return services.filter((service) => service.organizationId === orgFilter);
  }, [orgFilter, services]);

  async function updateService(
    serviceId: string,
    patch: Partial<Pick<ManagedServiceRow, "availabilityStatus" | "isActive" | "eligibilityBadge" | "isCrisis">>
  ) {
    setSavingId(serviceId);
    setError(null);
    try {
      const current = services.find((service) => service.id === serviceId);
      const res = await fetch(`/api/manager/services/${serviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availabilityStatus: patch.availabilityStatus ?? current?.availabilityStatus ?? "open",
          isActive: patch.isActive ?? current?.isActive,
          eligibilityBadge: patch.eligibilityBadge ?? current?.eligibilityBadge ?? "",
          isCrisis: patch.isCrisis ?? current?.isCrisis ?? false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed.");

      setServices((prev) =>
        prev.map((service) =>
          service.id === serviceId
            ? {
                ...service,
                availabilityStatus: data.service.availabilityStatus,
                isActive: data.service.isActive,
                eligibilityBadge: data.service.eligibilityBadge ?? "",
                isCrisis: data.service.isCrisis,
                updatedAt: data.service.updatedAt,
                auditHistory: [
                  {
                    id: `${serviceId}-${Date.now()}`,
                    actor_email: "Current manager",
                    actor_role: "manager",
                    action: "service_update",
                    changes: {},
                    created_at: new Date().toISOString(),
                  },
                  ...service.auditHistory,
                ].slice(0, 5),
              }
            : service
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Service Status Manager</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Update live wait-times so caseworkers can refer clients to services that can actually help today.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
        >
          <RefreshCcw className="h-4 w-4" /> Refresh
        </button>
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/manager-signin";
          }}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
        >
          Sign out
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-neutral-700">Filter by organisation</label>
        <select
          value={orgFilter}
          onChange={(e) => setOrgFilter(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="all">All organisations</option>
          {organizations.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
      </div>

      {loading && (
        <p className="mt-6 flex items-center gap-2 text-sm text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading services...
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {!loading && !error && (
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-2 py-2">Service</th>
                <th className="px-2 py-2">Organisation</th>
                <th className="px-2 py-2">Category</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Eligibility</th>
                <th className="px-2 py-2">Crisis</th>
                <th className="px-2 py-2">Visible</th>
                <th className="px-2 py-2">Last Updated</th>
                <th className="px-2 py-2">History</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((service) => (
                <Fragment key={service.id}>
                <tr className="border-b border-neutral-100 align-top">
                  <td className="px-2 py-3">
                    <div className="font-medium text-neutral-900">{service.title}</div>
                    {service.isCrisis && <div className="mt-1 text-xs font-medium text-red-700">Crisis service</div>}
                  </td>
                  <td className="px-2 py-3 text-neutral-600">
                    <div>{service.organizationName}</div>
                    <div className="text-xs text-neutral-400">{service.organizationCity ?? "West Midlands"}</div>
                  </td>
                  <td className="px-2 py-3 text-neutral-600">{service.category}</td>
                  <td className="px-2 py-3">
                    <select
                      value={service.availabilityStatus}
                      onChange={(e) =>
                        updateService(service.id, {
                          availabilityStatus: e.target.value as ServiceAvailabilityStatus,
                        })
                      }
                      disabled={savingId === service.id}
                      className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-3">
                    <input
                      type="text"
                      value={service.eligibilityBadge}
                      disabled={savingId === service.id}
                      onChange={(e) =>
                        setServices((prev) =>
                          prev.map((item) =>
                            item.id === service.id ? { ...item, eligibilityBadge: e.target.value } : item
                          )
                        )
                      }
                      onBlur={() => updateService(service.id, { eligibilityBadge: service.eligibilityBadge })}
                      className="w-44 rounded-md border border-neutral-300 px-2 py-1.5 text-xs"
                      placeholder="Who is this for?"
                    />
                  </td>
                  <td className="px-2 py-3">
                    <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                      <input
                        type="checkbox"
                        checked={service.isCrisis}
                        disabled={savingId === service.id}
                        onChange={(e) => updateService(service.id, { isCrisis: e.target.checked })}
                        className="h-4 w-4 accent-red-600"
                      />
                      {service.isCrisis ? "Yes" : "No"}
                    </label>
                  </td>
                  <td className="px-2 py-3">
                    <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                      <input
                        type="checkbox"
                        checked={service.isActive}
                        disabled={savingId === service.id}
                        onChange={(e) => updateService(service.id, { isActive: e.target.checked })}
                        className="h-4 w-4 accent-emerald-700"
                      />
                      {savingId === service.id ? "Saving..." : service.isActive ? "Shown" : "Hidden"}
                    </label>
                  </td>
                  <td className="px-2 py-3 text-xs text-neutral-500">
                    {new Date(service.updatedAt).toLocaleString("en-GB")}
                  </td>
                  <td className="px-2 py-3">
                    <button
                      type="button"
                      onClick={() => setExpandedId((prev) => (prev === service.id ? null : service.id))}
                      className="rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
                    >
                      {expandedId === service.id ? "Hide" : "Show"}
                    </button>
                  </td>
                </tr>
                {expandedId === service.id && (
                  <tr className="border-b border-neutral-100 bg-neutral-50/60">
                    <td colSpan={9} className="px-3 py-3">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Recent audit history</p>
                        {service.auditHistory.length > 0 ? (
                          <ul className="space-y-2">
                            {service.auditHistory.map((entry) => (
                              <li key={entry.id} className="rounded-md border border-neutral-200 bg-white p-2 text-xs text-neutral-700">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="font-medium">{entry.action}</span>
                                  <span className="text-neutral-500">{new Date(entry.created_at).toLocaleString("en-GB")}</span>
                                </div>
                                <p className="mt-1 text-neutral-500">
                                  {entry.actor_email ?? "Unknown user"} ({entry.actor_role})
                                </p>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-neutral-500">No audit history yet.</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-2 py-10 text-center text-sm text-neutral-500">
                    No services found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
