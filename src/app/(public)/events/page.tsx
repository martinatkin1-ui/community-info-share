import { Suspense } from "react";
import DiscoveryFeed from "@/components/ClientDashboard/DiscoveryFeed";
import ErrorBoundary from "@/components/ErrorBoundary";
import HeroBanner from "@/components/HeroBanner";

export default function EventsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <HeroBanner
        className="mb-8"
        eyebrow="West Midlands Events"
        title="Discover Local Community Events"
        description="Workshops, wellbeing sessions, support groups, and community activities across Birmingham, Wolverhampton, Coventry, and surrounding neighborhoods."
        imageUrl="/images/local-area/birmingham-canal.jpg"
        imagePositionClassName="object-[center_50%] sm:object-[center_42%]"
      />

      <ErrorBoundary>
        <Suspense fallback={<div className="py-20 text-center text-neutral-400">Loading…</div>}>
          <DiscoveryFeed />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}
