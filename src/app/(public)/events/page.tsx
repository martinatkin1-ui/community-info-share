import DiscoveryFeed from "@/components/ClientDashboard/DiscoveryFeed";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function EventsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <ErrorBoundary>
        <DiscoveryFeed />
      </ErrorBoundary>
    </main>
  );
}
