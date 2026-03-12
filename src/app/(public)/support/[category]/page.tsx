import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getRankedOrganizations,
  type SupportCategoryId,
} from "@/lib/organizations/ranking";
import CompassionateSupportHeader from "@/components/support/CompassionateSupportHeader";

const CATEGORY_CONTENT: Record<
  SupportCategoryId,
  {
    title: string;
    overview: string;
    imageUrl: string;
    ctaLabel: string;
  }
> = {
  "prison-leavers": {
    title: "Support for Prison Leavers",
    overview:
      "Welcome back. Transitioning to society can feel like a mountain to climb, but you don't have to do it alone. We've mapped out the most reliable local partners ready to help you with housing, ID, and a fresh start today.",
    imageUrl: "/images/local-area/ironbridge.jpg",
    ctaLabel: "Start with highest priority support",
  },
  "residential-rehab-graduates": {
    title: "Aftercare for Rehab Graduates",
    overview:
      "Completing treatment is a massive achievement. Staying connected is the next step. These West Midlands services specialize in 'aftercare' and peer support to help you protect your recovery in the real world.",
    imageUrl: "/images/local-area/birmingham-canal-regeneration.jpg",
    ctaLabel: "Find aftercare and peer support",
  },
  "mental-health-discharge": {
    title: "Mental Health Discharge Support",
    overview:
      "Leaving the hospital can feel vulnerable. This page highlights immediate 'Crisis Cafes' and community mental health teams who understand your journey and can offer a soft landing.",
    imageUrl: "/images/local-area/coventry-cathedral.jpg",
    ctaLabel: "Find immediate community support",
  },
  "homelessness-support": {
    title: "Homelessness Emergency Support",
    overview:
      "If you are without a safe place tonight, use the 'Quick Call' buttons below. These organizations provide emergency shelter, hot food, and legal advocacy across the West Midlands.",
    imageUrl: "/images/local-area/library-of-birmingham.jpg",
    ctaLabel: "Use quick-call support options",
  },
  "new-to-recovery": {
    title: "New to Recovery",
    overview:
      "The first few days are the hardest. Here you will find 'Open Access' hubs and fellowship meetings where you can walk in without an appointment and find someone who understands.",
    imageUrl: "/images/local-area/birmingham-canal.jpg",
    ctaLabel: "Find open access help now",
  },
};

function toTelHref(phone: string) {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

const EMERGENCY_ACTIONS = [
  { label: "Call 999 (Immediate danger)", href: "tel:999" },
  { label: "NHS 111 (Urgent medical advice)", href: "tel:111" },
  { label: "Samaritans 116 123", href: "tel:116123" },
];

export default async function SupportCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!(category in CATEGORY_CONTENT)) {
    notFound();
  }

  const key = category as SupportCategoryId;
  const content = CATEGORY_CONTENT[key];
  const organizations = await getRankedOrganizations(key);
  const topMatches = organizations.slice(0, 3);
  const emergencyProviders = organizations.filter((org) => org.isEmergencyProvider || !!org.quickCallPhone);

  return (
    <main className="space-y-6 pb-12">
      <CompassionateSupportHeader
        title={content.title}
        overview={content.overview}
        imageUrl={content.imageUrl}
        ctaLabel={content.ctaLabel}
      />

      <section className="wm-card space-y-4 border-red-200 bg-red-50/70">
        <h2 className="text-2xl font-semibold text-red-900">Need help right now?</h2>
        <p className="text-sm text-red-800">
          If there is immediate risk, call emergency services first. You can then use the quick-call partners below for same-day local support.
        </p>
        <div className="flex flex-wrap gap-2">
          {EMERGENCY_ACTIONS.map((action) => (
            <a key={action.href} href={action.href} className="wm-btn bg-red-700 hover:bg-red-800">
              {action.label}
            </a>
          ))}
        </div>
        {emergencyProviders.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {emergencyProviders.slice(0, 6).map((org) => (
              <article key={`emergency-${org.organizationId}`} className="rounded-xl border border-red-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-wm-slate">{org.organizationName}</h3>
                <p className="mt-1 text-xs text-neutral-600">{org.city ?? "West Midlands"}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {org.quickCallPhone && (
                    <a href={toTelHref(org.quickCallPhone)} className="wm-btn text-xs">
                      Call now
                    </a>
                  )}
                  {org.selfReferralUrl && (
                    <a
                      href={org.selfReferralUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="wm-btn-muted text-xs"
                    >
                      Self-referral
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-wm-slate">Top 3 best matches</h2>
          <p className="mt-1 text-sm text-neutral-600">Ranked using relevance 50%, immediate support 30%, and self-referral 20%.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {topMatches.map((org) => (
            <article key={`top-${org.organizationId}`} className="wm-glass rounded-2xl border-2 border-wm-teal/30 p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xl font-semibold text-wm-slate">{org.organizationName}</h3>
                <span className="rounded-full bg-wm-teal/15 px-2.5 py-1 text-xs font-semibold text-wm-teal">
                  Score {org.score}
                </span>
              </div>
              <p className="mt-2 text-sm text-neutral-600">{org.city ?? "West Midlands"}</p>
              <p className="mt-3 text-base leading-relaxed text-neutral-800">
                {org.supportStackSummary ?? "Local partner able to support with practical next steps and warm handovers."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {org.quickCallPhone ? (
                  <a href={toTelHref(org.quickCallPhone)} className="wm-btn text-sm">
                    Call now
                  </a>
                ) : null}
                {org.selfReferralUrl ? (
                  <a
                    href={org.selfReferralUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="wm-btn-muted text-sm"
                  >
                    Self-referral
                  </a>
                ) : (
                  <Link
                    href={`/referrals?toOrganizationId=${org.organizationId}&selfReferral=1`}
                    className="wm-btn-muted text-sm"
                  >
                    Referral form
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-wm-slate">Full support directory</h2>
          <p className="mt-1 text-sm text-neutral-600">Browse every verified partner matched to this pathway.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {organizations.map((org) => (
          <article key={org.organizationId} className="wm-glass rounded-2xl p-5">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-xl font-semibold text-wm-slate">{org.organizationName}</h2>
              <span className="rounded-full bg-wm-teal/15 px-2.5 py-1 text-xs font-semibold text-wm-teal">
                Score {org.score}
              </span>
            </div>

            <p className="mt-2 text-sm text-neutral-600">{org.city ?? "West Midlands"}</p>
            <p className="mt-3 text-base leading-relaxed text-neutral-800">
              {org.supportStackSummary ?? "Local partner able to support with practical next steps and warm handovers."}
            </p>

            {org.specialistTags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {org.specialistTags.map((tag) => (
                  <span key={tag} className="wm-chip text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {org.selfReferralUrl ? (
                <a
                  href={org.selfReferralUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wm-btn text-sm"
                >
                  Self-Referral
                </a>
              ) : (
                <Link
                  href={`/referrals?toOrganizationId=${org.organizationId}&selfReferral=1`}
                  className="wm-btn text-sm"
                >
                  Self-Referral
                </Link>
              )}
              {org.quickCallPhone ? (
                <a href={toTelHref(org.quickCallPhone)} className="wm-btn-muted text-sm">
                  Quick Call
                </a>
              ) : null}
              {org.websiteUrl ? (
                <a
                  href={org.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wm-btn-muted text-sm"
                >
                  Website
                </a>
              ) : null}
            </div>
          </article>
        ))}
        </div>
      </section>

      {organizations.length === 0 && (
        <section className="wm-card text-center">
          <h2 className="text-2xl font-semibold text-wm-slate">No ranked support yet</h2>
          <p className="mt-2 text-base text-neutral-600">
            We are refreshing local listings. Please try again shortly or use the general organisations directory.
          </p>
          <div className="mt-4">
            <Link href="/organizations" className="wm-btn">
              Browse all organisations
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
