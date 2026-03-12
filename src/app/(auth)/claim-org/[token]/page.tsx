"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface ClaimInfo {
  organizationId: string;
  organizationName: string;
  expiresAt: string;
}

export default function ClaimOrgPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params?.token ?? "";

  const [claimInfo, setClaimInfo] = useState<ClaimInfo | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/claim-org/${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Claim link is invalid.");
        if (!cancelled) {
          setClaimInfo(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Claim link is invalid.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const expiryText = useMemo(() => {
    if (!claimInfo?.expiresAt) return "";
    return new Date(claimInfo.expiresAt).toLocaleString("en-GB");
  }, [claimInfo?.expiresAt]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/claim-org/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not claim organization.");

      setMessage(data.message ?? "Organization claimed.");
      setTimeout(() => {
        router.push("/manager-signin");
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not claim organization.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-3xl font-semibold text-neutral-900">Claim Partner Account</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Use this secure link to create your manager account for the selected organization.
      </p>

      {loading && <p className="mt-4 text-sm text-neutral-500">Validating claim link...</p>}

      {!loading && claimInfo && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          <p className="font-semibold">{claimInfo.organizationName}</p>
          <p>Link expires: {expiryText}</p>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {claimInfo && (
        <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-neutral-700">Work Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              placeholder="manager@organisation.org"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              placeholder="At least 8 characters"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              required
            />
          </div>

          {message && <p className="text-sm text-emerald-700">{message}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50"
          >
            {submitting ? "Claiming..." : "Create Manager Account"}
          </button>
        </form>
      )}
    </main>
  );
}
