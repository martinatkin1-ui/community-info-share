export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-8 px-6 py-16">
      <section className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          West Midlands Wellbeing Portal
        </h1>
        <p className="max-w-2xl text-base text-neutral-600 sm:text-lg">
          A community health platform connecting local organizations, events, and
          consent-first referrals across Wolverhampton and the wider West Midlands.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <a className="rounded-lg border p-4 hover:bg-neutral-50" href="/organizations">
          View Organizations
        </a>
        <a className="rounded-lg border p-4 hover:bg-neutral-50" href="/events">
          Discover Events
        </a>
        <a className="rounded-lg border p-4 hover:bg-neutral-50" href="/referrals">
          Referral Pathway
        </a>
        <a className="rounded-lg border p-4 hover:bg-neutral-50" href="/manager-signin">
          Manager Login
        </a>
      </section>

      <p className="text-sm text-neutral-500">
        Foundation complete: Next.js 14 + Tailwind + Supabase schema scaffold.
      </p>
    </main>
  );
}
