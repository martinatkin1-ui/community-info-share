import OnboardingWizard from "@/components/OnboardingWizard/OnboardingWizard";
import { requireManagerPageAccess } from "@/lib/auth/managerPageGuard";

export default async function OrganizationOnboardingPage() {
  await requireManagerPageAccess({ nextPath: "/onboarding" });

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="rounded-3xl bg-gradient-to-r from-brand-amber/30 via-brand-sky/20 to-brand-lime/30 px-6 py-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-slate/70">
          West Midlands Wellbeing Portal
        </p>
        <h1 className="mt-2 text-3xl font-bold text-brand-slate sm:text-4xl">
          Organization Manager Onboarding
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-brand-slate/80">
          Build your trusted profile, connect your event feed, and join our Warm Handover referral network.
          Most teams complete this in under 6 minutes.
        </p>
      </header>

      <section className="mt-8">
        <OnboardingWizard />
      </section>
    </main>
  );
}
