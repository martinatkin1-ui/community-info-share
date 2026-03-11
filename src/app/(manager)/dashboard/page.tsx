import Link from "next/link";
import { redirect } from "next/navigation";

import { getManagerAccessContext } from "@/lib/auth/managerAccess";

export default async function ManagerDashboardPage() {
  const access = await getManagerAccessContext();

  if (!access) {
    redirect("/manager-signin?next=/dashboard");
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Manager Dashboard</h1>
      <p className="mt-3 text-neutral-600">
        Manage organization profile claims, events, referrals, and scrape reviews.
      </p>

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link className="rounded-lg border p-4 hover:bg-neutral-50" href="/admin">
          Super Admin Verification Dashboard
        </Link>
        <Link className="rounded-lg border p-4 hover:bg-neutral-50" href="/onboarding">
          Organization Onboarding Wizard
        </Link>
        <Link className="rounded-lg border p-4 hover:bg-neutral-50" href="/scrape-dry-run">
          Event Scraper Dry Run
        </Link>
        <Link className="rounded-lg border p-4 hover:bg-neutral-50" href="/scrape-health">
          Scrape Health Dashboard
        </Link>
        <Link className="rounded-lg border p-4 hover:bg-neutral-50" href="/service-status">
          Service Status Manager
        </Link>
        <Link className="rounded-lg border p-4 hover:bg-neutral-50" href="/organizations">
          View Public Organizations
        </Link>
      </section>
    </main>
  );
}
