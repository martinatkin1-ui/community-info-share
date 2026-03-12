import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import {
  getRankedOrganizations,
  type SupportCategoryId,
} from "@/lib/organizations/ranking";

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

  return (
    <main className="space-y-6 pb-12">
      <header className="relative overflow-hidden rounded-3xl border border-white/30 text-white">
        <Image
          src={content.imageUrl}
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/20" aria-hidden="true" />
        <div className="relative px-6 py-10 sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Specialist Support Route</p>
          <h1 className="mt-2 text-4xl font-bold leading-tight sm:text-5xl">{content.title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/95">{content.overview}</p>
          <p className="mt-4 inline-flex rounded-full bg-white/20 px-4 py-2 text-base font-semibold">{content.ctaLabel}</p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
              <Link
                href={`/referrals?toOrganizationId=${org.organizationId}&selfReferral=1`}
                className="wm-btn text-sm"
              >
                Self-Referral
              </Link>
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
