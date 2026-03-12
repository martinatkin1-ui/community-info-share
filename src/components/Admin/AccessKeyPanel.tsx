"use client";

import { useEffect, useState } from "react";

interface OrgOption {
  id: string;
  name: string;
}

interface AccessKeyRow {
  id: string;
  tokenPreview: string;
  expiresAt: string;
  createdAt: string;
  organizationId: string;
  organizations?: { name?: string } | Array<{ name?: string }> | null;
}

interface AccessKeyPanelProps {
  organizations: OrgOption[];
}

export default function AccessKeyPanel({ organizations }: AccessKeyPanelProps) {
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id ?? "");
  const [rows, setRows] = useState<AccessKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadKeys() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/access-keys");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load access keys.");
      setRows(data.keys ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadKeys();
  }, []);

  async function generateKey(e: React.FormEvent) {
    e.preventDefault();
    if (!organizationId) return;

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/access-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate key.");

      setMessage(
        `New referral token: ${data.rawKey} (expires ${new Date(data.key.expires_at).toLocaleDateString("en-GB")})`
      );
      await loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setSubmitting(false);
    }
  }

  function orgName(row: AccessKeyRow) {
    const value = row.organizations;
    if (!value) return "Unknown organisation";
    if (Array.isArray(value)) return value[0]?.name ?? "Unknown organisation";
    return value.name ?? "Unknown organisation";
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-neutral-900">Volunteer Access Keys</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Generate or rotate 8-character organisation referral tokens. Each token expires every 90 days.
      </p>

      <form onSubmit={generateKey} className="mt-4 grid gap-3 sm:grid-cols-[1fr,auto]">
        <select
          value={organizationId}
          onChange={(e) => setOrganizationId(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          required
        >
          <option value="">Select organisation</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>{org.name}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={submitting || !organizationId}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {submitting ? "Generating..." : "Generate Token"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}

      <div className="mt-4 overflow-x-auto">
        {loading ? (
          <p className="text-sm text-neutral-500">Loading tokens...</p>
        ) : (
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-2 py-2">Organisation</th>
                <th className="px-2 py-2">Token</th>
                <th className="px-2 py-2">Expires</th>
                <th className="px-2 py-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-neutral-100">
                  <td className="px-2 py-2 text-neutral-700">{orgName(row)}</td>
                  <td className="px-2 py-2 font-mono font-semibold tracking-wider text-brand-slate">{row.tokenPreview}</td>
                  <td className="px-2 py-2 text-neutral-600">{new Date(row.expiresAt).toLocaleDateString("en-GB")}</td>
                  <td className="px-2 py-2 text-neutral-500">{new Date(row.createdAt).toLocaleDateString("en-GB")}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-2 py-8 text-center text-neutral-500">
                    No tokens generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
