"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";

interface PendingOrgOption {
  id: string;
  name: string;
}

interface InviteManagerPanelProps {
  organizations: PendingOrgOption[];
}

export default function InviteManagerPanel({ organizations }: InviteManagerPanelProps) {
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  async function submitInvite(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/invite-manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send invite.");
      setMessage(data.message ?? "Invite generated.");
      setInviteUrl(data.inviteUrl ?? null);
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
        Generate a 48-hour secure claim link you can share via SMS or WhatsApp.
      </p>

      <form onSubmit={submitInvite} className="mt-4 grid gap-3 sm:grid-cols-[1fr,auto]">
        <select
          value={organizationId}
          onChange={(e) => setOrganizationId(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          required
        >
          <option value="">Select organization</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>{org.name}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading || !organizationId}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Claim Link"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}

      <Dialog.Root open={!!inviteUrl} onOpenChange={(open) => !open && setInviteUrl(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl">
            <Dialog.Title className="text-lg font-semibold text-neutral-900">Invite Link Ready</Dialog.Title>
            <p className="mt-1 text-sm text-neutral-600">
              Share this one-time 48-hour claim URL with the manager.
            </p>

            <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <p className="break-all font-mono text-xs text-neutral-700">{inviteUrl}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (!inviteUrl) return;
                  await navigator.clipboard.writeText(inviteUrl);
                  setMessage("Invite link copied to clipboard.");
                }}
                className="rounded-md bg-brand-slate px-3 py-2 text-sm font-semibold text-white hover:bg-brand-slate/90"
              >
                Copy to Clipboard
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Welcome to West Midlands Wellbeing Portal. Use this one-time manager onboarding link: ${inviteUrl ?? ""}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                Share via WhatsApp
              </a>

              <Dialog.Close className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100">
                Close
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
