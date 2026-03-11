"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function ManagerAcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createBrowserSupabaseClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolveInviteSession() {
      setError(null);

      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else if (tokenHash && type) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as "invite" | "recovery" | "magiclink" | "email_change",
          });
          if (verifyError) throw verifyError;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          throw new Error(
            "Auth session missing. Re-open the original invite link, then set your password."
          );
        }

        if (!cancelled) {
          setSessionReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not validate invite session.");
        }
      }
    }

    resolveInviteSession();

    return () => {
      cancelled = true;
    };
  }, [searchParams, supabase.auth]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!sessionReady) {
      setError("Invite session is not ready yet. Re-open your invite link and try again.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setSuccess("Password set. Redirecting to manager dashboard...");
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-3xl font-semibold">Set Your Manager Password</h1>
      <p className="mt-3 text-neutral-600">
        Use this once after opening your invite link.
      </p>

      {!sessionReady && !error && (
        <p className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Validating your invite session...
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-neutral-700">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
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

        {error && <p className="text-sm text-red-700">{error}</p>}
        {success && <p className="text-sm text-emerald-700">{success}</p>}

        <button
          type="submit"
          disabled={loading || !sessionReady}
          className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Set Password"}
        </button>
      </form>
    </main>
  );
}
