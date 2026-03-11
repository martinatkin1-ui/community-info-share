"use client";

import { useState } from "react";

interface PendingOrgOption {
  id: string;
  name: string;
}

interface InviteManagerPanelProps {
  organizations: PendingOrgOption[];
}

export default function InviteManagerPanel({ organizations }: InviteManagerPanelProps) {
  const [email, setEmail] = useState("");
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submitInvite(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/invite-manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, organizationId: organizationId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send invite.");
      setMessage(data.message ?? "Invite sent.");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-neutral-900">Invite Organization Manager</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Send a real Supabase Auth invite so a manager can sign in and maintain their organization record.
      </p>

      <form onSubmit={submitInvite} className="mt-4 grid gap-3 sm:grid-cols-[1.2fr,1fr,auto]">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="manager@organisation.org"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          required
        />
        <select
          value={organizationId}
          onChange={(e) => setOrganizationId(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">No organization selected</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>{org.name}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Invite"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
    </section>
  );
}
