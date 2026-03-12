"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function VolunteerSignInPage() {
  const router = useRouter();
  const [keyCode, setKeyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!keyCode.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/volunteer/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyCode: keyCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Access key not recognised.");
      router.push("/volunteer-portal");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-6 py-16">
      <div className="w-full rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        {/* Logo area */}
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-slate text-2xl">
            🤝
          </div>
          <h1 className="text-2xl font-bold text-brand-slate">Volunteer Access</h1>
          <p className="text-sm text-neutral-500">
            Enter your organisation&rsquo;s 8-character access key to open the
            volunteer view.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="keyCode" className="block text-sm font-medium text-neutral-700 mb-1">
              Organisation Access Key
            </label>
            <input
              id="keyCode"
              type="text"
              value={keyCode}
              onChange={(e) => setKeyCode(e.target.value.toUpperCase())}
              placeholder="e.g. A3K9WX7P"
              maxLength={12}
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-center text-2xl font-mono tracking-[0.3em] uppercase shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-slate"
              required
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || keyCode.replace(/[\s\-]/g, "").length < 8}
            className="w-full rounded-xl bg-brand-slate py-3 text-sm font-semibold text-white transition hover:bg-brand-slate/90 disabled:opacity-50"
          >
            {loading ? "Verifying…" : "Enter Volunteer View"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-neutral-400">
          Don&rsquo;t have a key?{" "}
          <Link href="/manager-signin" className="text-brand-coral hover:underline">
            Sign in as a manager
          </Link>{" "}
          or ask your administrator.
        </p>
      </div>
    </main>
  );
}
