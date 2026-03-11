import ClientHero from "@/components/ClientHero";

export default function Home() {
  return (
    <>
      <ClientHero />

      {/* Brief orientation strip below hero */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-brand-slate">Community Events</h2>
            <p className="mt-2 text-sm text-neutral-600">Workshops, groups, and drop-ins across the region — updated in real time.</p>
            <a href="/events" className="mt-4 inline-block text-sm font-semibold text-brand-coral hover:underline">Browse events →</a>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-brand-slate">Support Services</h2>
            <p className="mt-2 text-sm text-neutral-600">Housing, mental health, debt advice, and more — find what&apos;s available near you.</p>
            <a href="/organizations" className="mt-4 inline-block text-sm font-semibold text-brand-coral hover:underline">Find services →</a>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-brand-slate">Local Organisations</h2>
            <p className="mt-2 text-sm text-neutral-600">Browse every verified West Midlands organisation and their full wraparound offer.</p>
            <a href="/organizations" className="mt-4 inline-block text-sm font-semibold text-brand-coral hover:underline">View organisations →</a>
          </div>
        </div>
      </section>
    </>
  );
}
