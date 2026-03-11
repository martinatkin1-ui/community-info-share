import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { COOKIE_NAME, verifyVolunteerToken } from "@/lib/volunteer/session";

export default async function VolunteerPortalPage() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const session = token ? verifyVolunteerToken(token) : null;

  if (!session) redirect("/volunteer-signin");

  const expiresDate = new Date(session.exp).toLocaleString("en-GB", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Header */}
      <header className="rounded-3xl bg-gradient-to-r from-brand-slate via-[#3d4460] to-[#2D3142] px-6 py-8 text-white">
        <p className="text-sm font-semibold uppercase tracking-widest opacity-70">
          Volunteer Portal
        </p>
        <h1 className="mt-1 text-3xl font-bold">{session.orgName}</h1>
        <p className="mt-2 text-sm opacity-70">
          Session active until {expiresDate} &mdash; this tab only.
        </p>
        <form action="/api/volunteer/signout" method="POST" className="mt-4 inline-block">
          <button
            type="submit"
            className="rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-medium text-white hover:bg-white/20"
          >
            Sign out
          </button>
        </form>
      </header>

      {/* Quick actions */}
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          href="/events"
          className="group flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-brand-sky/50 hover:shadow-md"
        >
          <span className="text-2xl">📅</span>
          <h2 className="font-semibold text-brand-slate">Browse Events</h2>
          <p className="text-sm text-neutral-500">
            Find upcoming community events and sessions across the West Midlands.
          </p>
        </Link>

        <Link
          href={`/referrals?fromOrgId=${session.orgId}`}
          className="group flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-brand-coral/50 hover:shadow-md"
        >
          <span className="text-2xl">📋</span>
          <h2 className="font-semibold text-brand-slate">Submit a Referral</h2>
          <p className="text-sm text-neutral-500">
            Refer a client to another West Midlands organisation. Your org is pre-filled.
          </p>
        </Link>

        <Link
          href="/organizations"
          className="group flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-brand-amber/50 hover:shadow-md"
        >
          <span className="text-2xl">🏢</span>
          <h2 className="font-semibold text-brand-slate">Find Services</h2>
          <p className="text-sm text-neutral-500">
            Search support services available to your clients across the region.
          </p>
        </Link>
      </section>

      {/* Role note */}
      <div className="mt-8 rounded-2xl border border-brand-amber/40 bg-brand-amber/10 px-5 py-4 text-sm text-amber-800">
        <strong>Volunteer view</strong> — you can browse and submit referrals. Organisation
        management, editing, and deletion of records require a manager account.
      </div>
    </main>
  );
}
